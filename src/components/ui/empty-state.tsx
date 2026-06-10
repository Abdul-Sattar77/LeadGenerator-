import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span className="relative mb-4 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-200/60 to-fuchsia-200/60 blur-md" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-soft backdrop-blur">
          <Icon className="h-6 w-6 text-primary" />
        </span>
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
