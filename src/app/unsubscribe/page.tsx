import UnsubscribeClient from "./UnsubscribeClient";

export const metadata = { title: "Unsubscribe · LeadFinder" };

export default function UnsubscribePage({ searchParams }: { searchParams: { cid?: string; t?: string } }) {
  return <UnsubscribeClient cid={searchParams.cid ?? ""} token={searchParams.t ?? ""} />;
}
