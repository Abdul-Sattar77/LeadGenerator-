import * as React from "react";
import { cn } from "@/lib/utils";

// Dense, professional data table (CRM-style). Wrap in a bordered card + overflow.
export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  // Horizontal scroll on mobile; visible on md+ so the sticky header can pin
  // to the viewport while the list scrolls.
  return (
    <div className="w-full overflow-x-auto md:overflow-visible">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}
export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  // Sticky to the top of the scroll area so column labels stay while scrolling.
  return (
    <thead
      className={cn("sticky top-0 z-20 bg-card [&_tr]:border-b [&_tr]:border-border", className)}
      {...props}
    />
  );
}
export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}
export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-secondary/50", className)} {...props} />;
}
export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2.5 align-middle", className)} {...props} />;
}
