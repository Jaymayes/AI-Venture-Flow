/**
 * Card.jsx — Sovereign Design System
 *
 * Two variants:
 *   "client"     → Variation A (Premium Minimalist): flat bg-slate-900, subtle borders, generous whitespace
 *   "enterprise" → Variation C (High-Contrast Enterprise): opaque bg-slate-950, sharp borders, tight padding
 *
 * Props:
 *   variant    - "client" | "enterprise" (default: "enterprise")
 *   className  - Additional Tailwind classes (merged, never overrides base)
 *   children   - Card content
 *   padding    - Override padding ("none" disables, or custom like "p-4")
 */

export function Card({ variant = "enterprise", className = "", padding, children, ...rest }) {
  const base = variant === "client"
    ? "rounded-xl bg-slate-900 border border-slate-800/60"
    : "rounded-lg bg-slate-950 border border-slate-700";

  const pad = padding === "none"
    ? ""
    : padding || (variant === "client" ? "p-8" : "p-5");

  return (
    <div className={`${base} ${pad} ${className}`} {...rest}>
      {children}
    </div>
  );
}

/**
 * StatCard — Metric display card with label, value, optional icon & delta.
 *
 * Props:
 *   variant    - "client" | "enterprise"
 *   label      - KPI label text
 *   value      - Formatted value string (e.g. "$92,450.00")
 *   icon       - Lucide icon component (optional)
 *   delta      - Change text like "+12.4%" (optional)
 *   deltaType  - "positive" | "negative" | "neutral"
 *   className  - Additional classes
 */
export function StatCard({
  variant = "enterprise",
  label,
  value,
  icon: Icon,
  delta,
  deltaType = "positive",
  className = "",
}) {
  const deltaColors = {
    positive: variant === "client"
      ? "bg-emerald-500/10 text-emerald-400"
      : "text-emerald-400 bg-emerald-500/10",
    negative: variant === "client"
      ? "bg-red-500/10 text-red-400"
      : "text-red-400 bg-red-500/10",
    neutral: variant === "client"
      ? "bg-slate-500/10 text-slate-400"
      : "text-slate-400 bg-slate-500/10",
  };

  if (variant === "client") {
    return (
      <Card variant="client" className={className}>
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500 mb-1">
          {label}
        </p>
        <p className="text-3xl font-semibold text-white tracking-tight">{value}</p>
        {(delta || Icon) && (
          <div className="mt-4 flex items-center gap-2">
            {delta && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${deltaColors[deltaType]}`}>
                {delta}
              </span>
            )}
            {Icon && <Icon size={14} className="text-slate-600" />}
          </div>
        )}
      </Card>
    );
  }

  // Enterprise variant
  return (
    <Card variant="enterprise" className={className}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {delta && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${deltaColors[deltaType]}`}>
            {delta}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-2xl font-bold text-white tracking-tight font-mono">{value}</p>
        {Icon && <Icon size={18} className="text-slate-600" />}
      </div>
    </Card>
  );
}

export default Card;
