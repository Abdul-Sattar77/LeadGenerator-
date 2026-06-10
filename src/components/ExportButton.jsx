"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportLeadsToCSV } from "@/lib/export";

export default function ExportButton({ leads, filename = "leads.csv", className }) {
  const disabled = !leads || leads.length === 0;
  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={() => exportLeadsToCSV(leads, filename)}
      className={className}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
