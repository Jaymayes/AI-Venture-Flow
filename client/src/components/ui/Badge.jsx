/**
 * Badge.jsx — Sovereign Design System
 *
 * Semantic status pills with consistent color language across all portals.
 *
 * Props:
 *   variant    - "client" | "enterprise" (default: "enterprise")
 *   color      - Semantic color: "success" | "warning" | "neutral" | "destructive" | "info" | "purple"
 *                OR any Tailwind color name: "emerald" | "amber" | "slate" | "red" | "sky" | "violet" | "cyan" | "blue" | "rose"
 *   children   - Badge label text
 *   className  - Additional classes
 */

const SEMANTIC_MAP = {
  success:     "emerald",
  warning:     "amber",
  neutral:     "slate",
  destructive: "red",
  info:        "sky",
  purple:      "purple",
};

const COLOR_STYLES = {
  emerald: { client: "bg-emerald-500/10 text-emerald-400", enterprise: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  amber:   { client: "bg-amber-500/10 text-amber-400",     enterprise: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  slate:   { client: "bg-slate-500/10 text-slate-400",     enterprise: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
  red:     { client: "bg-red-500/10 text-red-400",         enterprise: "text-red-400 bg-red-500/10 border-red-500/30" },
  rose:    { client: "bg-rose-500/10 text-rose-400",       enterprise: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  sky:     { client: "bg-sky-500/10 text-sky-400",         enterprise: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  blue:    { client: "bg-blue-500/10 text-blue-400",       enterprise: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  violet:  { client: "bg-violet-500/10 text-violet-400",   enterprise: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
  purple:  { client: "bg-purple-500/10 text-purple-400",   enterprise: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  cyan:    { client: "bg-cyan-500/10 text-cyan-400",       enterprise: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  orange:  { client: "bg-orange-500/10 text-orange-400",   enterprise: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
};

export function Badge({ variant = "enterprise", color = "neutral", className = "", children }) {
  const resolvedColor = SEMANTIC_MAP[color] || color;
  const styles = COLOR_STYLES[resolvedColor] || COLOR_STYLES.slate;
  const colorClass = styles[variant] || styles.enterprise;

  const shape = variant === "client"
    ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    : "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide";

  return (
    <span className={`${shape} ${colorClass} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
