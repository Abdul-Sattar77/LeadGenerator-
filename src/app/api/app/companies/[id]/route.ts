import { route, ok, fail } from "@/server/http";
import { getCompany, updateCompany, deleteCompany } from "@/server/services/companyService";
import { updateCompanySchema } from "@/lib/validations/company";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, params }) => {
  const company = await getCompany(ctx, params.id);
  if (!company) return fail("Company not found.", 404);
  return ok(company);
});

export const PATCH = route({ role: "SALES_REP", body: updateCompanySchema }, async ({ ctx, params, body }) => {
  return ok(await updateCompany(ctx, params.id, body));
});

export const DELETE = route({ role: "MANAGER" }, async ({ ctx, params }) => {
  await deleteCompany(ctx, params.id);
  return ok({ ok: true });
});
