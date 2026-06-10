// Custom LeadFinder brand mark: a location pin fused with a radar/target,
// signalling "pinpointing leads on the map". Pure SVG, scales crisply.
export function LogoMark({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lf-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="lf-shine" x1="10" y1="6" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Rounded gradient tile */}
      <rect width="48" height="48" rx="13" fill="url(#lf-grad)" />
      <rect width="48" height="48" rx="13" fill="url(#lf-shine)" />

      {/* Location pin */}
      <path
        d="M24 11c-5.25 0-9.5 4.18-9.5 9.34 0 6.57 8.07 14.2 9.04 15.1a.67.67 0 0 0 .92 0c.97-.9 9.04-8.53 9.04-15.1C33.5 15.18 29.25 11 24 11Z"
        fill="#ffffff"
      />
      {/* Target rings inside the pin head */}
      <circle cx="24" cy="20.3" r="5" fill="url(#lf-grad)" />
      <circle cx="24" cy="20.3" r="2.1" fill="#ffffff" />

      {/* Sparkle */}
      <path
        d="M37 9.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z"
        fill="#ffffff"
        opacity="0.9"
      />
    </svg>
  );
}

export function Logo({ size = 36, className = "" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} className="drop-shadow-sm" />
      <span className="text-lg font-bold tracking-tight">
        Lead<span className="text-gradient">Finder</span>
      </span>
    </span>
  );
}
