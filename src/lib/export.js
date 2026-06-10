// Export an array of lead objects to a downloadable CSV file.
const COLUMNS = [
  ["name", "Name"],
  ["category", "Category"],
  ["phone", "Phone"],
  ["rating", "Rating"],
  ["reviews", "Reviews"],
  ["website", "Website"],
  ["maps", "Google Maps"],
  ["address", "Address"],
];

function cell(value) {
  return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
}

export function exportLeadsToCSV(leads, filename = "leads.csv") {
  if (!leads || !leads.length) return;
  const header = COLUMNS.map(([, label]) => cell(label)).join(",");
  const rows = leads.map((lead) =>
    COLUMNS.map(([key]) => cell(lead[key])).join(",")
  );
  const csv = "﻿" + [header, ...rows].join("\r\n"); // BOM = Excel-friendly

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
