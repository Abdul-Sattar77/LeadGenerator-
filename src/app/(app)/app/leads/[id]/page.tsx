import { notFound } from "next/navigation";
import { requireAuth } from "@/server/tenant";
import { getLead, listOrgMembers } from "@/server/services/leadService";
import LeadDetailClient from "./LeadDetailClient";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const data = await getLead(ctx, id);
  if (!data) notFound();

  const members = await listOrgMembers(ctx);
  return <LeadDetailClient id={id} initial={data} members={members} />;
}
