import { z } from "zod";
import { route, ok } from "@/server/http";
import { bulkCompanies } from "@/server/services/companyService";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one company.").max(500),
  action: z.enum(["delete", "assignOwner", "addTag"]),
  value: z.string().optional(),
});

export const POST = route({ role: "SALES_REP", body: schema }, async ({ ctx, body }) =>
  ok(await bulkCompanies(ctx, body.ids, body.action, body.value))
);
