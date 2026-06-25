import { prisma } from "@/server/db";
import LeadFormClient from "./LeadFormClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get in touch" };

export default async function PublicLeadFormPage({ params }: { params: { org: string } }) {
  const org = await prisma.organization.findUnique({ where: { id: params.org }, select: { name: true } });
  return <LeadFormClient orgId={params.org} orgName={org?.name ?? "us"} found={Boolean(org)} />;
}
