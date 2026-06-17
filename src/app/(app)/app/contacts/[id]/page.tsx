import { requireAuth } from "@/server/tenant";
import ContactDetail from "./ContactDetail";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  await requireAuth();
  return <ContactDetail id={params.id} />;
}
