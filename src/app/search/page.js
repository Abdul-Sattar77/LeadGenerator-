import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export const metadata = {
  title: "Find Leads — LeadFinder",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-12 text-muted-foreground">Loading…</div>}>
      <SearchClient />
    </Suspense>
  );
}
