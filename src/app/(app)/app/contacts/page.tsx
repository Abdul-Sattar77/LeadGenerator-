import { requireAuth } from "@/server/tenant";
import ContactsClient from "./ContactsClient";

export const metadata = { title: "Contacts · LeadFinder" };

export default async function ContactsPage() {
  await requireAuth();
  return <ContactsClient />;
}
