import { z } from "zod";
import { route, ok } from "@/server/http";
import { importContacts } from "@/server/services/contactService";

export const dynamic = "force-dynamic";

const rowSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  companyName: z.string().optional(),
});

const schema = z.object({ rows: z.array(rowSchema).min(1).max(2000) });

export const POST = route({ role: "SALES_REP", body: schema }, async ({ ctx, body }) =>
  ok(await importContacts(ctx, body.rows), { status: 201 })
);
