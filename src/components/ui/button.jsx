import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-glow",
  gradient:
    "brand-gradient text-white shadow-soft hover:opacity-95 hover:shadow-glow",
  outline:
    "border border-border bg-card text-foreground hover:bg-secondary",
  ghost: "text-foreground hover:bg-secondary",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

const sizes = {
  default: "h-11 px-5 text-sm",
  sm: "h-9 px-3.5 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-10 w-10",
};

export function Button({
  className = "",
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
