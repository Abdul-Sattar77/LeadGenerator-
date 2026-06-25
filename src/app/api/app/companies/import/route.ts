import { z } from "zod";
import { route, ok } from "@/server/http";
import { importCompanies } from "@/server/services/companyService";

export const dynamic = "force-dynamic";

const rowSchema = z.object({
  name: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const schema = z.object({ rows: z.array(rowSchema).min(1).max(2000) });

export const POST = route({ role: "SALES_REP", body: schema }, async ({ ctx, body }) =>
  ok(await importCompanies(ctx, body.rows), { status: 201 })
);
