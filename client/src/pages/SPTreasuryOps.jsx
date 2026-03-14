/**
 * SPTreasuryOps.jsx — Sovereign Professional Treasury Dashboard
 *
 * Epic 9: Real-time financial ledger for authenticated SPs.
 * Fetches from GET /api/sp/ledger (IDOR-protected, ROUND-safe aggregations).
 *
 * Features:
 *   - 4 KPI stat cards (Lifetime GMV, Pending Escrow, Available Balance, Total Withdrawn)
 *   - 10 most recent transactions table with status badges
 *   - Intl.NumberFormat for locale-safe currency rendering
 *   - AbortController for memory-safe useEffect cleanup
 *   - Zero third-party charting or formatting libraries
 *
 * Design: Variation C — High-Contrast Enterprise (Sovereign Design System)
 */

import { useState, useEffect } from "react";
import { getAuthToken } from "../lib/auth-store";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, StatCard } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table } from "../components/ui/Table";

const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://moltbot-triage-engine.jamarr.workers.dev";

// ─────────────────────────────────────────────────────────────────────────
// Currency Formatter (Intl.NumberFormat — no external deps)
// ─────────────────────────────────────────────────────────────────────────

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ─────────────────────────────────────────────────────────────────────────
// Status Badge Color Map
// ─────────────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  escrow: "amber",
  ready_for_release: "emerald",
  paid: "emerald",
  pending_payout: "blue",
  flagged: "rose",
};

const STATUS_LABELS = {
  escrow: "Escrow",
  ready_for_release: "Ready",
  paid: "Paid",
  pending_payout: "Pending",
  flagged: "Flagged",
};

// ─────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────

export default function SPTreasuryOps() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken() || sessionStorage.getItem("rsllc_sp_token");
        const spEmail = sessionStorage.getItem("rsllc_sp_email") || "";
        const res = await fetch(`${API_BASE}/api/sp/ledger`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-partner-email": spEmail,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(`${res.status} — ${body.error || "Request failed"}`);
          return;
        }

        const data = await res.json();
        setSummary(data.summary || { lifetimeGmv: 0, pendingEscrow: 0, availableBalance: 0, totalWithdrawn: 0 });
        setTransactions(data.transactions || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Network error");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [refreshKey]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading treasury data...</span>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="mx-auto max-w-2xl mt-10">
        <Card variant="enterprise" className="border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 font-medium">Treasury Unavailable</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="mt-4 border-red-500/30 text-red-300 hover:bg-red-500/10"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const s = summary || { lifetimeGmv: 0, pendingEscrow: 0, availableBalance: 0, totalWithdrawn: 0 };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Treasury</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Your financial overview and payout history</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* ── 4-Grid Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="enterprise"
          label="Lifetime GMV"
          value={fmtUSD.format(s.lifetimeGmv)}
          icon={DollarSign}
        />
        <StatCard
          variant="enterprise"
          label="Pending Escrow"
          value={fmtUSD.format(s.pendingEscrow)}
          icon={Clock}
        />
        <StatCard
          variant="enterprise"
          label="Available Balance"
          value={fmtUSD.format(s.availableBalance)}
          icon={CheckCircle2}
        />
        <StatCard
          variant="enterprise"
          label="Total Withdrawn"
          value={fmtUSD.format(s.totalWithdrawn)}
          icon={ArrowDownToLine}
        />
      </div>

      {/* ── Ledger Table ── */}
      <Table
        variant="enterprise"
        title="Recent Transactions"
        subtitle={`${transactions.length} records`}
      >
        {transactions.length === 0 ? (
          <Table.Body>
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center">
                <DollarSign className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No transactions yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  Payouts appear here after deals close
                </p>
              </td>
            </tr>
          </Table.Body>
        ) : (
          <>
            <Table.Header>
              <tr>
                <Table.HeaderCell variant="enterprise">Prospect</Table.HeaderCell>
                <Table.HeaderCell variant="enterprise">Company</Table.HeaderCell>
                <Table.HeaderCell variant="enterprise" align="right">TCV</Table.HeaderCell>
                <Table.HeaderCell variant="enterprise" align="right">Your Payout</Table.HeaderCell>
                <Table.HeaderCell variant="enterprise" align="center">Status</Table.HeaderCell>
                <Table.HeaderCell variant="enterprise">Date</Table.HeaderCell>
              </tr>
            </Table.Header>
            <Table.Body>
              {transactions.map((tx) => (
                <Table.Row key={tx.id} variant="enterprise">
                  <Table.Cell variant="enterprise" className="text-white font-medium">
                    {tx.prospect_name || "—"}
                  </Table.Cell>
                  <Table.Cell variant="enterprise" className="text-slate-400">
                    {tx.prospect_company || "—"}
                  </Table.Cell>
                  <Table.Cell variant="enterprise" align="right" mono className="text-slate-300">
                    {fmtUSD.format(tx.tcv)}
                  </Table.Cell>
                  <Table.Cell variant="enterprise" align="right" mono className="text-emerald-400">
                    {fmtUSD.format(tx.partner_total_payout)}
                  </Table.Cell>
                  <Table.Cell variant="enterprise" align="center">
                    <Badge
                      variant="enterprise"
                      color={STATUS_COLORS[tx.status] || "slate"}
                    >
                      {STATUS_LABELS[tx.status] || tx.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell variant="enterprise" className="text-slate-500 text-[11px] font-mono">
                    {tx.created_at
                      ? new Date(tx.created_at + "Z").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </>
        )}
      </Table>
    </div>
  );
}
