/**
 * Table.jsx — Sovereign Design System
 *
 * Clean, responsive data table layout.
 *
 * Two variants:
 *   "client"     → Variation A: subtle borders, generous padding, rounded-xl wrapper
 *   "enterprise" → Variation C: sharp borders, tight padding, rounded-lg wrapper, mono values
 *
 * Usage:
 *   <Table variant="enterprise" title="Recent Deals" subtitle="3 records">
 *     <Table.Header>
 *       <Table.HeaderCell>Client</Table.HeaderCell>
 *       <Table.HeaderCell align="right">Value</Table.HeaderCell>
 *     </Table.Header>
 *     <Table.Body>
 *       <Table.Row>
 *         <Table.Cell>Acme Corp</Table.Cell>
 *         <Table.Cell align="right" mono>$42,500</Table.Cell>
 *       </Table.Row>
 *     </Table.Body>
 *   </Table>
 */

// ── Wrapper ──
export function Table({ variant = "enterprise", title, subtitle, className = "", children }) {
  const wrapper = variant === "client"
    ? "rounded-xl bg-slate-900 border border-slate-800/60 overflow-hidden"
    : "rounded-lg bg-slate-950 border border-slate-700 overflow-hidden";

  return (
    <div className={`${wrapper} ${className}`}>
      {title && (
        <div className={`flex items-center justify-between ${
          variant === "client"
            ? "px-6 py-4 border-b border-slate-800/40"
            : "px-4 py-2.5 border-b border-slate-700"
        }`}>
          <p className={
            variant === "client"
              ? "text-[11px] font-medium uppercase tracking-widest text-slate-500"
              : "text-[11px] font-semibold uppercase tracking-wider text-slate-400"
          }>
            {title}
          </p>
          {subtitle && (
            <span className="text-[10px] font-mono text-slate-600">{subtitle}</span>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className={variant === "client" ? "w-full text-sm" : "w-full text-[13px]"}>
          {children}
        </table>
      </div>
    </div>
  );
}

// ── Header ──
Table.Header = function TableHeader({ className = "", children }) {
  return <thead className={className}>{children}</thead>;
};

// ── HeaderCell ──
Table.HeaderCell = function TableHeaderCell({ variant = "enterprise", align = "left", className = "", children }) {
  const base = variant === "client"
    ? "text-[11px] font-medium uppercase tracking-wider text-slate-600"
    : "text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950";

  const pad = variant === "client" ? "px-6 py-3" : "px-4 py-2";
  const textAlign = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return <th className={`${pad} ${base} ${textAlign} ${className}`}>{children}</th>;
};

// ── Body ──
Table.Body = function TableBody({ className = "", children }) {
  return <tbody className={className}>{children}</tbody>;
};

// ── Row ──
Table.Row = function TableRow({ variant = "enterprise", className = "", children }) {
  const border = variant === "client"
    ? "border-t border-slate-800/30 hover:bg-slate-800/20"
    : "border-t border-slate-800 hover:bg-slate-900";

  return <tr className={`${border} transition-colors ${className}`}>{children}</tr>;
};

// ── Cell ──
Table.Cell = function TableCell({ variant = "enterprise", align = "left", mono = false, className = "", children }) {
  const pad = variant === "client" ? "px-6 py-4" : "px-4 py-2.5";
  const textAlign = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const font = mono ? "font-mono text-xs" : "";

  return (
    <td className={`${pad} ${textAlign} ${font} whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
};

export default Table;
