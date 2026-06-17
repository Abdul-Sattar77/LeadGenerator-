import { route, ok } from "@/server/http";
import { listCompanies, createCompany } from "@/server/services/companyService";
import { createCompanySchema } from "@/lib/validations/company";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, req }) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") || "20", 10) || 20));
  const result = await listCompanies(
    ctx,
    { q: searchParams.get("q") || undefined, ownerId: searchParams.get("ownerId") || undefined },
    page,
    pageSize
  );
  return ok({ ...result, page, pageSize });
});

export const POST = route({ role: "SALES_REP", body: createCompanySchema }, async ({ ctx, body }) => {
  const company = await createCompany(ctx, body);
  return ok(company, { status: 201 });
});
