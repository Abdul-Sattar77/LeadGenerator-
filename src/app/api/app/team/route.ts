import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { listMembers, addMember } from "@/server/services/teamService";
import { addMemberSchema } from "@/lib/validations/team";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ members: await listMembers(ctx) });
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "ADMIN")) return NextResponse.json({ error: "Only admins can add members." }, { status: 403 });

  const parsed = addMemberSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  }
  const result = await addMember(ctx, parsed.data);
  if ("error" in result) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result, { status: 201 });
}
