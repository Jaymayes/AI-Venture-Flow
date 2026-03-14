/**
 * Button.jsx — Sovereign Design System
 *
 * Three variants, two sizes.
 *
 * Props:
 *   variant   - "primary" | "secondary" | "ghost" (default: "secondary")
 *   size      - "sm" | "md" (default: "md")
 *   disabled  - Boolean
 *   className - Additional classes
 *   children  - Button content
 *   ...rest   - Passes through onClick, type, etc.
 */

const VARIANT_STYLES = {
  primary:   "bg-white text-slate-950 font-semibold hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500",
  secondary: "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-50",
  ghost:     "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50",
};

const SIZE_STYLES = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
};

export function Button({
  variant = "secondary",
  size = "md",
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
