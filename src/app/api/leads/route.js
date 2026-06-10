import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadKey, STAGE_KEYS, DEFAULT_STAGE } from "@/lib/crm";

export const dynamic = "force-dynamic";

// Turn a DB row into the shape the UI expects (tags as array, dates as ISO).
function serialize(row) {
  let tags = [];
  try {
    tags = JSON.parse(row.tags || "[]");
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    category: row.category,
    phone: row.phone,
    rating: row.rating,
    reviews: row.reviews,
    website: row.website,
    maps: row.maps,
    address: row.address,
    businessStatus: row.businessStatus,
    status: row.businessStatus, // backward-compat with existing UI
    stage: row.stage,
    notes: row.notes,
    tags,
    followUpDate: row.followUpDate ? row.followUpDate.toISOString() : null,
    savedAt: row.savedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/leads  -> all saved leads (newest first)
export async function GET() {
  try {
    const rows = await prisma.lead.findMany({ orderBy: { savedAt: "desc" } });
    return NextResponse.json({ leads: rows.map(serialize) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/leads  -> save (upsert) a lead. CRM fields are preserved if it exists.
export async function POST(request) {
  try {
    const lead = await request.json();
    const key = leadKey(lead);
    if (!key || key === "|") {
      return NextResponse.json({ error: "Invalid lead." }, { status: 400 });
    }

    const business = {
      name: lead.name || "",
      category: lead.category || "",
      phone: lead.phone || "",
      rating: lead.rating ?? null,
      reviews: lead.reviews ?? null,
      website: lead.website || "",
      maps: lead.maps || "",
      address: lead.address || "",
      businessStatus: lead.businessStatus || lead.status || "",
    };

    const row = await prisma.lead.upsert({
      where: { key },
      update: business, // refresh business data, keep CRM fields untouched
      create: { key, ...business, stage: DEFAULT_STAGE },
    });

    return NextResponse.json({ lead: serialize(row) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/leads?key=...  -> update CRM fields (stage, notes, tags, followUpDate)
export async function PATCH(request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key." }, { status: 400 });
    }
    const body = await request.json();
    const data = {};

    if (body.stage !== undefined) {
      if (!STAGE_KEYS.includes(body.stage)) {
        return NextResponse.json({ error: "Invalid stage." }, { status: 400 });
      }
      data.stage = body.stage;
    }
    if (body.notes !== undefined) data.notes = String(body.notes);
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags || []);
    if (body.followUpDate !== undefined) {
      data.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
    }

    const row = await prisma.lead.update({ where: { key }, data });
    return NextResponse.json({ lead: serialize(row) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/leads?key=...  -> remove a saved lead
export async function DELETE(request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key." }, { status: 400 });
    }
    await prisma.lead.delete({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
