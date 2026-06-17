import { route, ok } from "@/server/http";
import { searchAll } from "@/server/services/searchService";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, req }) => {
  const { searchParams } = new URL(req.url);
  return ok(await searchAll(ctx, searchParams.get("q") || ""));
});
