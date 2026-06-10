import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { roleAtLeast, type Role } from "@/lib/enums";

export interface TenantContext {
  userId: string;
  organizationId: string;
  role: string;
  name: string;
  email: string;
}

/** Returns the current tenant context, or null if not signed in. */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    role: session.user.role,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

/** Use in Server Components / layouts: redirects to /login when unauthenticated. */
export async function requireAuth(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Throws when the current user is below `minimum`. Pair with requireAuth(). */
export function requireRole(ctx: TenantContext, minimum: Role): void {
  if (!roleAtLeast(ctx.role, minimum)) {
    throw new Error(`Forbidden: requires ${minimum} role.`);
  }
}
