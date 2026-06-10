# LeadFinder CRM — Production Architecture

> **Vision:** Evolve LeadFinder from a Google-Maps lead *search* tool into a full
> **Lead Generation CRM** — *Apollo.io (discovery) + HubSpot (CRM/pipeline) + Google Maps (data)*,
> focused on selling to **local businesses**.

This document is the single source of truth for the rebuild. It covers the 10 deliverables:
DB schema · folder structure · pages · dashboard · components · API · user flow · SaaS architecture · best practices · phased implementation plan.

---

## 0. Stack & Key Decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Server Components + Route Handlers = one codebase for UI + API |
| Language | **TypeScript** | Type safety across DB → API → UI (migrate from current JS) |
| DB | **PostgreSQL** | Relational, multi-tenant, scales (current SQLite is dev-only) |
| ORM | **Prisma** | Already in use; type-safe schema |
| Auth | **Auth.js (NextAuth v5)** | Credentials + OAuth + sessions; pairs with Prisma adapter |
| Styling | **Tailwind + shadcn/ui** | Accessible, ownable components |
| Server state | **TanStack React Query** | Caching, mutations, optimistic updates |
| Client state | **Zustand** | Lightweight UI state (pipeline drag, modals, filters) |
| Animation | **Framer Motion** | Already in use |
| Billing | **Stripe** | Subscriptions, invoices, webhooks |
| AI | **Anthropic Claude (claude-opus-4-8 / claude-haiku-4-5)** | Email gen, summaries, lead scoring |
| Email | **Resend** (transactional) + tracking pixel/link redirect | Outreach + open/click tracking |
| Queue/jobs | **Inngest** or **BullMQ** | Scheduled emails, score recompute, report exports |
| Validation | **Zod** | Shared input schemas (API + forms) |

### Multi-tenancy model
**Shared database, shared schema, row-level isolation by `organizationId`.**
Every tenant-scoped table carries `organizationId`. A central Prisma middleware + a per-request
`getTenantContext()` guard **forces** the org filter on every query so no query can leak across tenants.

```
Organization (tenant)
  └── Users (Admin / Manager / SalesRep / Viewer)
  └── Leads → Contacts → Deals
  └── Pipelines → Stages
  └── Tasks, Activities, Notes
  └── Campaigns → EmailMessages
  └── Subscription → Invoices
```

---

## 1. Complete Prisma Schema

`prisma/schema.prisma` (PostgreSQL). Relations, enums, and indexes included.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────── ENUMS ───────────────
enum Role            { ADMIN MANAGER SALES_REP VIEWER }
enum LeadStatus      { NEW CONTACTED QUALIFIED INTERESTED PROPOSAL_SENT NEGOTIATION WON LOST }
enum LeadSource      { GOOGLE_MAPS MANUAL IMPORT REFERRAL WEBSITE }
enum TaskType        { CALL MEETING EMAIL REMINDER }
enum TaskStatus      { PENDING IN_PROGRESS COMPLETED OVERDUE }
enum TaskPriority    { LOW MEDIUM HIGH URGENT }
enum DealStatus      { OPEN WON LOST }
enum CampaignStatus  { DRAFT RUNNING COMPLETED }
enum EmailStatus     { DRAFT SCHEDULED SENT OPENED CLICKED BOUNCED FAILED }
enum EmailTemplateType { INTRODUCTION FOLLOW_UP PROPOSAL CLOSING CUSTOM }
enum ActivityType    { LEAD_CREATED LEAD_UPDATED STATUS_CHANGED TASK_CREATED TASK_COMPLETED NOTE_ADDED CALL_LOGGED EMAIL_SENT DEAL_CREATED DEAL_WON DEAL_LOST LEAD_ASSIGNED }
enum NotificationType{ LEAD_ASSIGNED TASK_DUE DEAL_WON FOLLOW_UP_REMINDER MENTION }
enum PlanTier        { FREE PRO AGENCY }
enum SubStatus       { TRIALING ACTIVE PAST_DUE CANCELED }

// ─────────────── TENANT & AUTH ───────────────
model Organization {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  createdAt     DateTime @default(now())

  users         User[]
  leads         Lead[]
  contacts      Contact[]
  deals         Deal[]
  tasks         Task[]
  activities    Activity[]
  notes         Note[]
  campaigns     Campaign[]
  pipelines     Pipeline[]
  tags          Tag[]
  templates     EmailTemplate[]
  emails        EmailMessage[]
  notifications Notification[]
  subscription  Subscription?
  invoices      Invoice[]
}

model User {
  id               String   @id @default(cuid())
  organizationId   String
  email            String   @unique
  passwordHash     String?            // null when social-only
  name             String
  avatarUrl        String?
  role             Role     @default(SALES_REP)
  emailVerified    DateTime?
  twoFactorEnabled Boolean  @default(false)
  twoFactorSecret  String?
  createdAt        DateTime @default(now())

  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  accounts         Account[]            // OAuth providers
  assignedLeads    Lead[]       @relation("LeadAssignee")
  ownedDeals       Deal[]       @relation("DealOwner")
  tasks            Task[]       @relation("TaskAssignee")
  createdTasks     Task[]       @relation("TaskCreator")
  activities       Activity[]
  notes            Note[]
  notifications    Notification[]
  sentEmails       EmailMessage[]

  @@index([organizationId])
}

model Account {            // social login (NextAuth)
  id                String  @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// ─────────────── PIPELINE ───────────────
model Pipeline {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  isDefault      Boolean  @default(false)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  stages         PipelineStage[]
  deals          Deal[]
  @@index([organizationId])
}

model PipelineStage {
  id          String  @id @default(cuid())
  pipelineId  String
  name        String         // New, Contacted, Qualified, ...
  order       Int
  color       String  @default("#6366F1")
  pipeline    Pipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  deals       Deal[]
  @@index([pipelineId])
}

// ─────────────── LEADS ───────────────
model Lead {
  id              String     @id @default(cuid())
  organizationId  String
  businessName    String
  contactPerson   String?
  email           String?
  phone           String?
  website         String?
  address         String?
  city            String?
  country         String?
  industry        String?
  category        String?
  rating          Float?
  reviewCount     Int?
  googleMapsUrl   String?
  latitude        Float?
  longitude       Float?
  source          LeadSource @default(GOOGLE_MAPS)
  status          LeadStatus @default(NEW)
  leadScore       Int        @default(0)        // 0–100
  scoreBreakdown  Json?                          // {website:20, rating:18, ...}
  assignedUserId  String?
  campaignId      String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  assignedUser    User?      @relation("LeadAssignee", fields: [assignedUserId], references: [id])
  campaign        Campaign?  @relation(fields: [campaignId], references: [id])
  contact         Contact?
  deal            Deal?
  tags            LeadTag[]
  notes           Note[]
  tasks           Task[]
  activities      Activity[]
  emails          EmailMessage[]

  @@index([organizationId, status])
  @@index([assignedUserId])
}

model Tag {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  color          String   @default("#94a3b8")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  leads          LeadTag[]
  @@unique([organizationId, name])
}

model LeadTag {            // explicit M:N join
  leadId String
  tagId  String
  lead   Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([leadId, tagId])
}

// ─────────────── CONTACTS ───────────────
model Contact {
  id             String   @id @default(cuid())
  organizationId String
  leadId         String?  @unique            // promoted from a Lead
  name           String
  company        String?
  email          String?
  phone          String?
  address        String?
  lifetimeValue  Decimal  @default(0) @db.Decimal(12, 2)
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  lead           Lead?    @relation(fields: [leadId], references: [id])
  deals          Deal[]
  activities     Activity[]
  notes          Note[]
  @@index([organizationId])
}

// ─────────────── DEALS ───────────────
model Deal {
  id               String     @id @default(cuid())
  organizationId   String
  name             String
  value            Decimal    @default(0) @db.Decimal(12, 2)
  currency         String     @default("USD")
  status           DealStatus @default(OPEN)
  pipelineId       String
  stageId          String
  leadId           String?    @unique
  contactId        String?
  ownerId          String?
  expectedCloseDate DateTime?
  closedAt         DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  organization     Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  pipeline         Pipeline      @relation(fields: [pipelineId], references: [id])
  stage            PipelineStage @relation(fields: [stageId], references: [id])
  lead             Lead?         @relation(fields: [leadId], references: [id])
  contact          Contact?      @relation(fields: [contactId], references: [id])
  owner            User?         @relation("DealOwner", fields: [ownerId], references: [id])
  tasks            Task[]
  activities       Activity[]
  notes            Note[]
  @@index([organizationId, status])
  @@index([stageId])
}

// ─────────────── TASKS / FOLLOW-UPS ───────────────
model Task {
  id             String       @id @default(cuid())
  organizationId String
  title          String
  description    String?
  type           TaskType     @default(CALL)
  status         TaskStatus   @default(PENDING)
  priority       TaskPriority @default(MEDIUM)
  dueDate        DateTime?
  completedAt    DateTime?
  assignedUserId String?
  createdById    String?
  leadId         String?
  dealId         String?
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  assignedUser   User?  @relation("TaskAssignee", fields: [assignedUserId], references: [id])
  createdBy      User?  @relation("TaskCreator",  fields: [createdById],   references: [id])
  lead           Lead?  @relation(fields: [leadId], references: [id])
  deal           Deal?  @relation(fields: [dealId], references: [id])
  @@index([organizationId, status])
  @@index([assignedUserId, dueDate])
}

// ─────────────── ACTIVITY / TIMELINE ───────────────
model Activity {
  id             String       @id @default(cuid())
  organizationId String
  type           ActivityType
  userId         String?
  leadId         String?
  dealId         String?
  contactId      String?
  metadata       Json?         // {from:"NEW", to:"CONTACTED"} etc.
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User?    @relation(fields: [userId], references: [id])
  lead           Lead?    @relation(fields: [leadId], references: [id])
  deal           Deal?    @relation(fields: [dealId], references: [id])
  contact        Contact? @relation(fields: [contactId], references: [id])
  @@index([organizationId, createdAt])
  @@index([leadId])
}

model Note {
  id             String   @id @default(cuid())
  organizationId String
  body           String
  userId         String?
  leadId         String?
  dealId         String?
  contactId      String?
  createdAt      DateTime @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User?    @relation(fields: [userId], references: [id])
  lead           Lead?    @relation(fields: [leadId], references: [id])
  deal           Deal?    @relation(fields: [dealId], references: [id])
  contact        Contact? @relation(fields: [contactId], references: [id])
  @@index([leadId])
}

// ─────────────── CAMPAIGNS & EMAIL ───────────────
model Campaign {
  id             String         @id @default(cuid())
  organizationId String
  name           String
  description    String?
  status         CampaignStatus @default(DRAFT)
  createdById    String?
  createdAt      DateTime       @default(now())
  organization   Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  leads          Lead[]
  emails         EmailMessage[]
  @@index([organizationId])
}

model EmailTemplate {
  id             String            @id @default(cuid())
  organizationId String
  name           String
  subject        String
  body           String
  type           EmailTemplateType @default(CUSTOM)
  organization   Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  messages       EmailMessage[]
  @@index([organizationId])
}

model EmailMessage {
  id             String      @id @default(cuid())
  organizationId String
  templateId     String?
  campaignId     String?
  leadId         String?
  fromUserId     String?
  toEmail        String
  subject        String
  body           String
  status         EmailStatus @default(DRAFT)
  scheduledAt    DateTime?
  sentAt         DateTime?
  openedAt       DateTime?
  clickedAt      DateTime?
  openCount      Int         @default(0)
  clickCount     Int         @default(0)
  trackingId     String      @unique @default(cuid())

  organization   Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  template       EmailTemplate? @relation(fields: [templateId], references: [id])
  campaign       Campaign?      @relation(fields: [campaignId], references: [id])
  lead           Lead?          @relation(fields: [leadId], references: [id])
  fromUser       User?          @relation(fields: [fromUserId], references: [id])
  @@index([organizationId, status])
}

// ─────────────── NOTIFICATIONS ───────────────
model Notification {
  id             String           @id @default(cuid())
  organizationId String
  userId         String
  type           NotificationType
  title          String
  body           String?
  link           String?
  read           Boolean          @default(false)
  createdAt      DateTime         @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, read])
}

// ─────────────── BILLING ───────────────
model Subscription {
  id                   String    @id @default(cuid())
  organizationId       String    @unique
  plan                 PlanTier  @default(FREE)
  status               SubStatus @default(TRIALING)
  seats                Int       @default(1)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  currentPeriodEnd     DateTime?
  organization         Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invoices             Invoice[]
}

model Invoice {
  id              String   @id @default(cuid())
  organizationId  String
  subscriptionId  String
  stripeInvoiceId String?
  amount          Decimal  @db.Decimal(12, 2)
  currency        String   @default("USD")
  status          String                 // paid, open, void
  issuedAt        DateTime @default(now())
  pdfUrl          String?
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  @@index([organizationId])
}
```

---

## 2. Folder Structure

```
lead-finder/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/                 # public site — current landing/pricing
│  │  │  ├─ page.tsx
│  │  │  └─ pricing/page.tsx
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ register/page.tsx
│  │  │  ├─ forgot-password/page.tsx
│  │  │  └─ verify-email/page.tsx
│  │  ├─ (app)/                       # authenticated CRM — guarded by layout
│  │  │  ├─ layout.tsx                # sidebar + topbar + auth guard
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ discover/page.tsx         # lead search (current LeadFinder)
│  │  │  ├─ leads/
│  │  │  │  ├─ page.tsx               # table + filters
│  │  │  │  └─ [id]/page.tsx          # lead profile + timeline
│  │  │  ├─ pipeline/page.tsx         # kanban
│  │  │  ├─ deals/[id]/page.tsx
│  │  │  ├─ contacts/[id]/page.tsx
│  │  │  ├─ tasks/page.tsx
│  │  │  ├─ campaigns/[id]/page.tsx
│  │  │  ├─ reports/page.tsx
│  │  │  ├─ team/page.tsx
│  │  │  └─ settings/
│  │  │     ├─ profile/page.tsx
│  │  │     ├─ billing/page.tsx
│  │  │     └─ organization/page.tsx
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts
│  │     ├─ leads/route.ts            # GET list / POST create
│  │     ├─ leads/[id]/route.ts       # GET / PATCH / DELETE
│  │     ├─ leads/search/route.ts     # Google Places proxy
│  │     ├─ deals/...                 # CRUD
│  │     ├─ tasks/...
│  │     ├─ campaigns/...
│  │     ├─ contacts/...
│  │     ├─ reports/route.ts
│  │     ├─ ai/route.ts               # email-gen / summarize / score
│  │     ├─ notifications/route.ts
│  │     ├─ stripe/checkout/route.ts
│  │     ├─ stripe/webhook/route.ts
│  │     └─ email/track/[id]/route.ts # open/click pixel
│  ├─ components/
│  │  ├─ ui/                          # shadcn primitives (button, card, dialog…)
│  │  ├─ layout/                      # Sidebar, Topbar, CommandMenu
│  │  ├─ leads/                       # LeadTable, LeadCard, LeadFilters, SaveLeadButton
│  │  ├─ pipeline/                    # KanbanBoard, StageColumn, DealCard
│  │  ├─ tasks/                       # TaskList, TaskDialog
│  │  ├─ dashboard/                   # StatCard, LeadsChart, Funnel
│  │  ├─ timeline/                    # ActivityTimeline, NoteComposer
│  │  └─ ai/                          # AiAssistantPanel
│  ├─ server/
│  │  ├─ db.ts                        # Prisma client singleton + tenant middleware
│  │  ├─ auth.ts                      # Auth.js config
│  │  ├─ tenant.ts                    # getTenantContext(), requireRole()
│  │  └─ services/                    # leadService, dealService, scoringService, billingService
│  ├─ lib/
│  │  ├─ google-places.ts
│  │  ├─ stripe.ts
│  │  ├─ resend.ts
│  │  ├─ ai.ts                        # Anthropic client wrapper
│  │  ├─ validations/                 # Zod schemas (shared API + forms)
│  │  └─ utils.ts
│  ├─ hooks/                          # React Query hooks: useLeads, useDeals, useTasks
│  ├─ stores/                         # Zustand: usePipelineStore, useFilterStore, useUiStore
│  └─ types/
└─ ...
```

**Route groups** keep three distinct shells: `(marketing)` public, `(auth)` minimal, `(app)` CRM with sidebar + auth guard.

---

## 3. Pages (route map)

| Route | Purpose | Access |
|---|---|---|
| `/` , `/pricing` | Marketing (existing, redesigned) | Public |
| `/login` `/register` `/forgot-password` `/verify-email` | Auth | Public |
| `/dashboard` | Executive overview (cards + charts) | All roles |
| `/discover` | Google-Maps lead search → save/assign/tag | SalesRep+ |
| `/leads` | Lead table: filter, sort, bulk-tag, assign | SalesRep+ |
| `/leads/[id]` | Lead profile + activity timeline + notes + tasks | SalesRep+ |
| `/pipeline` | Kanban drag-and-drop, per-stage value | SalesRep+ |
| `/deals/[id]` | Deal detail + forecast | SalesRep+ |
| `/contacts/[id]` | Promoted contact + interaction history | SalesRep+ |
| `/tasks` | Calls/meetings/emails/reminders, statuses | SalesRep+ |
| `/campaigns/[id]` | Campaign + email analytics | Manager+ |
| `/reports` | Lead/Sales/Team reports, CSV/Excel/PDF export | Manager+ |
| `/team` | Invite, assign, performance | Manager+ |
| `/settings/profile` `/organization` `/billing` | Account + Stripe | Admin |

---

## 4. Dashboard Design

**Top row — KPI cards** (each = `StatCard` with delta vs last period):
`Total Leads` · `New Leads (30d)` · `Qualified Leads` · `Active Deals` · `Revenue (Won)` · `Tasks Due Today`.

**Charts (TanStack Query → server-aggregated):**
- **Leads per month** — bar chart, last 12 months.
- **Revenue trend** — area chart of won-deal value.
- **Conversion funnel** — NEW → CONTACTED → QUALIFIED → WON counts.
- **Team performance** — leaderboard: calls made, tasks completed, revenue per rep.

**Right rail:** Upcoming tasks (due today/overdue) + recent activity feed.

All numbers computed by `reportService` with `groupBy` Prisma queries, cached 60s via React Query, scoped to `organizationId` (and to `assignedUserId` for SalesRep role).

---

## 5. Component Structure (key contracts)

```
<KanbanBoard pipelineId>                   // pipeline/
  └─ <StageColumn stage, deals[]>          //   droppable; shows count + Σ value
       └─ <DealCard deal>                  //   draggable (dnd-kit); optimistic move

<LeadTable>                                // leads/
  ├─ <LeadFilters>  (status, tag, assignee, score) → useFilterStore (Zustand)
  ├─ <BulkActionBar> (tag / assign / add-to-campaign)
  └─ rows → <SaveLeadButton> <LeadScoreBadge>

<LeadProfile>                              // leads/[id]
  ├─ <LeadHeader> (status select, assignee, score)
  ├─ <ActivityTimeline activities[]>       // timeline/  chronological
  ├─ <NoteComposer>  <TaskDialog>
  └─ <AiAssistantPanel>  (summarize / draft email / next step)

<StatCard label value delta icon>          // dashboard/
<DataTable> (shared, shadcn + @tanstack/react-table)
```

State split: **server data** → React Query hooks (`useLeads`, `useDeal`, `useTasks`); **ephemeral UI** → Zustand (`usePipelineStore` for drag state, `useFilterStore`, `useUiStore` for modals/command-menu).

---

## 6. API Design (REST, CRUD)

All routes under `/api`, JSON, Zod-validated, tenant-guarded, role-checked.

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `[...nextauth]` (login/oauth/session), `POST /api/auth/forgot`, `POST /api/auth/verify` |
| Leads | `GET/POST /api/leads` · `GET/PATCH/DELETE /api/leads/:id` · `POST /api/leads/search` · `POST /api/leads/:id/assign` · `POST /api/leads/:id/convert` (→ Contact) |
| Tags | `GET/POST /api/tags` · `POST /api/leads/:id/tags` |
| Pipeline | `GET /api/pipelines` · `PATCH /api/deals/:id/move` (stage change) |
| Deals | `GET/POST /api/deals` · `GET/PATCH/DELETE /api/deals/:id` |
| Contacts | `GET/POST /api/contacts` · `GET/PATCH /api/contacts/:id` |
| Tasks | `GET/POST /api/tasks` · `PATCH /api/tasks/:id` (status/complete) |
| Activities | `GET /api/activities?leadId=` (read-only; written by services) |
| Notes | `POST /api/notes` · `GET /api/notes?leadId=` |
| Campaigns | `GET/POST /api/campaigns` · `GET /api/campaigns/:id/analytics` |
| Email | `POST /api/email/send` · `POST /api/email/schedule` · `GET /api/email/track/:id` (pixel) |
| Reports | `GET /api/reports?type=leads|sales|team&from&to&format=csv|xlsx|pdf` |
| AI | `POST /api/ai` `{ action: "email"|"summarize"|"score"|"next-step", leadId }` |
| Notifications | `GET /api/notifications` · `PATCH /api/notifications/:id/read` |
| Billing | `POST /api/stripe/checkout` · `POST /api/stripe/webhook` |

**Standard envelope:** `{ data, error?, meta:{ page, total } }`. List endpoints support `?page&pageSize&sort&q&status&assignee`.

**Every handler:**
```ts
const ctx = await getTenantContext(req)        // { orgId, userId, role } or 401
requireRole(ctx, ["MANAGER","ADMIN"])          // 403 if insufficient
const body = schema.parse(await req.json())    // Zod → 422 on fail
// prisma queries auto-scoped to ctx.orgId by middleware
```

---

## 7. CRM User Flow

```
Sign up → create Organization (becomes ADMIN) → verify email
   ↓
DISCOVER: search "Dentists in Karachi" → results from Google Places
   ↓  Save Lead (status NEW)  →  auto lead-score 0–100  →  Activity: LEAD_CREATED
   ↓  Tag + Assign to rep      →  Notification: LEAD_ASSIGNED
LEADS: rep opens lead profile → logs Call → Note "owner interested"
   ↓  Status → CONTACTED → QUALIFIED        (each → Activity + timeline)
OUTREACH: AI drafts intro email → Send → tracked (open/click)
   ↓  Create Task: follow-up call in 3 days (reminder → Notification)
PIPELINE: drag lead's Deal across stages; set value + close date
   ↓  Deal WON → revenue recorded → dashboard + reports update
REPORTS: manager exports monthly Sales + Team report (PDF)
BILLING: org upgrades Free → Pro via Stripe when limits hit
```

---

## 8. SaaS Architecture

- **Tenancy:** `organizationId` on every row; Prisma `$extends`/middleware injects the filter; `getTenantContext` resolves org from the session. Defense-in-depth = never trust a client-supplied orgId.
- **RBAC:** `ADMIN` (billing, team, settings) ⊃ `MANAGER` (reports, campaigns, all leads) ⊃ `SALES_REP` (own/assigned leads, deals, tasks) ⊃ `VIEWER` (read-only). Enforced server-side via `requireRole`, mirrored in UI by hiding controls.
- **Plan gating:** middleware checks `subscription.plan` + usage counters (e.g. Free = 50 leads/mo). `429`/upgrade-modal when exceeded.
- **Background jobs (Inngest/BullMQ):** scheduled-email send, overdue-task sweep (→ `OVERDUE` + notify), nightly lead-score recompute, async report/PDF generation.
- **Observability:** structured logs, Sentry, audit trail = the `Activity` table.
- **Security:** httpOnly session cookies, CSRF on mutations, rate-limit search/AI/auth, API key (Google/Stripe/Anthropic) server-only, encrypt 2FA secrets, Stripe webhook signature verification.

---

## 9. Best Practices

1. **Type safety end-to-end** — Prisma types → Zod schemas → React Query generics. No `any`.
2. **Server Components by default**; client components only for interactivity (kanban, forms, charts).
3. **Services layer** (`server/services/*`) holds business logic; route handlers stay thin.
4. **Single source for validation** — one Zod schema per entity, reused by API and forms (`react-hook-form` + `zodResolver`).
5. **Optimistic mutations** for drag/drop, task complete, status change; rollback on error.
6. **Idempotent webhooks** — store processed Stripe event IDs.
7. **Migrations only** (`prisma migrate`), never `db push` in prod; seed script for demo org.
8. **Accessibility** — shadcn/Radix primitives, keyboard-navigable kanban, focus rings.
9. **Pagination + indexes** on every list query; never load unbounded sets.
10. **Feature flags** for AI/billing so the app runs without external keys in dev.

---

## 10. Production-Ready Implementation Plan (phased)

> Migrating the **existing JS/SQLite** app, not greenfield. Each phase ships independently.

**Phase 0 — Foundation (week 1)**
TS migration (rename `.js`→`.tsx`, add `tsconfig`), swap SQLite→Postgres, install shadcn/React Query/Zustand/Zod, set provider boundaries. Port current search + save to the new structure.

**Phase 1 — Auth & Tenancy (week 1–2)**
Auth.js (credentials + Google OAuth), Organization on signup, email verify + reset, RBAC guards, `(app)` layout with sidebar. *Gate: a user can register an org and log in.*

**Phase 2 — Lead Management (week 2–3)**
Full Lead model + `/leads` table (filter/sort/bulk), `/leads/[id]` profile, tags, assignment, `Activity` timeline + `Note`s. Wire existing `/discover` search to Save→Lead.

**Phase 3 — Pipeline & Deals (week 3–4)**
Default pipeline + stages seed, kanban (dnd-kit) with optimistic moves, Deal CRUD, pipeline stats (conversion, win rate, avg size).

**Phase 4 — Tasks & Notifications (week 4)**
Tasks (types/status/priority/due), overdue sweep job, in-app notifications + bell.

**Phase 5 — Outreach (week 5)**
Email templates, Resend send + schedule, open/click tracking, Campaigns + analytics.

**Phase 6 — Dashboard & Reports (week 5–6)**
Executive dashboard cards + charts, report builder, CSV/Excel/PDF export.

**Phase 7 — AI (week 6)**
Anthropic wrapper: email drafting, lead summary, next-step suggestion, lead scoring (website/rating/reviews/industry/activity → 0–100, stored in `scoreBreakdown`).

**Phase 8 — Billing & Team (week 7)**
Stripe checkout + webhooks, plan gating + usage limits, team invites, seat management.

**Phase 9 — Hardening (week 8)**
Rate limits, Sentry, e2e tests (Playwright), load test, security review, deploy (Vercel + managed Postgres/Neon).

---

### Suggested lead-scoring formula (Phase 7)
```
score = clamp(0..100,
  (hasWebsite ? 20 : 0) +
  (rating >= 4.5 ? 20 : rating >= 4 ? 14 : rating >= 3 ? 7 : 0) +
  (reviewCount >= 200 ? 20 : reviewCount >= 50 ? 12 : reviewCount >= 10 ? 6 : 0) +
  (industryWeight[industry] ?? 5) +              // configurable per org
  (recentActivityCount * 4)                       // engagement signal
)
```
Persist both the integer and the per-factor `scoreBreakdown` JSON so the UI can explain *why*.
```
```
