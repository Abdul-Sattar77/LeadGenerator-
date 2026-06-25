import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { getTenantContext, type TenantContext } from "@/server/tenant";
import { roleAtLeast, type Role } from "@/lib/enums";
import { PlanLimitError } from "@/lib/plans";
import { logError } from "@/server/logger";

// Standard API envelope.
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}
export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

interface RouteOpts<T> {
  role?: Role;
  body?: ZodSchema<T>;
}
interface HandlerArgs<T> {
  ctx: TenantContext;
  body: T;
  req: Request;
  params: Record<string, string>;
}

/**
 * One wrapper for every authenticated API route: enforces auth + role, parses
 * the body with Zod, catches errors, and returns a consistent {data}|{error}.
 * Kills the copy-pasted guard boilerplate.
 */
export function route<T = undefined>(
  opts: RouteOpts<T>,
  handler: (args: HandlerArgs<T>) => Promise<Response> | Response
) {
  return async (req: Request, context: { params?: Record<string, string> }) => {
    const ctx = await getTenantContext();
    if (!ctx) return fail("Unauthorized", 401);
    if (opts.role && !roleAtLeast(ctx.role, opts.role)) return fail("Forbidden", 403);

    let body = undefined as T;
    if (opts.body) {
      let json: unknown;
      try {
        json = await req.json();
      } catch {
        return fail("Invalid JSON body.", 400);
      }
      const parsed = opts.body.safeParse(json);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
      body = parsed.data;
    }

    try {
      return await handler({ ctx, body, req, params: context?.params ?? {} });
    } catch (e) {
      // Plan caps (e.g. Free = 100 companies) → 402 so the UI can prompt upgrade.
      if (e instanceof PlanLimitError) return fail(e.message, 402);
      logError("API route error", e, { path: req.url, org: ctx.organizationId });
      const message = e instanceof Error ? e.message : "Server error";
      return fail(message, 500);
    }
  };
}
