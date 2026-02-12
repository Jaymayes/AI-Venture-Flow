import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Search,
  LayoutGrid,
  List,
  Users,
  DollarSign,
  TrendingUp,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { apiFetch } from "../lib/api";

/* ── constants ── */
const STAGES = ["inquiry", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"];
const STAGE_COLORS = {
  inquiry: "bg-blue-500/20 text-blue-400",
  qualified: "bg-yellow-500/20 text-yellow-400",
  proposal: "bg-purple-500/20 text-purple-400",
  negotiation: "bg-orange-500/20 text-orange-400",
  "closed-won": "bg-emerald-500/20 text-emerald-400",
  "closed-lost": "bg-red-500/20 text-red-400",
};
const STATUS_COLORS = {
  new: "bg-blue-500/20 text-blue-400",
  active: "bg-emerald-500/20 text-emerald-400",
  stale: "bg-yellow-500/20 text-yellow-400",
  lost: "bg-red-500/20 text-red-400",
};

const BLANK_LEAD = {
  name: "",
  email: "",
  phone: "",
  company: "",
  title: "",
  source: "website",
  stage: "inquiry",
  priority: "medium",
  notes: "",
  amount: "",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("pipeline"); // "pipeline" | "table"
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...BLANK_LEAD });
  const [saving, setSaving] = useState(false);

  /* ── fetch leads ── */
  const fetchLeads = async () => {
    try {
      const data = await apiFetch("GET", "/api/leads");
      setLeads(Array.isArray(data) ? data : data.leads || []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  /* ── derived ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        (l.name || "").toLowerCase().includes(q) ||
        (l.company || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q)
    );
  }, [leads, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortCol] ?? "";
      let bVal = b[sortCol] ?? "";
      if (sortCol === "amount") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      if (sortCol === "createdAt") {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      }
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const pipelineValue = leads.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const stageCounts = STAGES.reduce((acc, st) => {
    acc[st] = leads.filter((l) => l.stage === st).length;
    return acc;
  }, {});

  /* ── handlers ── */
  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        amount: form.amount ? Number(form.amount) : undefined,
      };
      await apiFetch("POST", "/api/leads", body);
      setShowModal(false);
      setForm({ ...BLANK_LEAD });
      fetchLeads();
    } catch (err) {
      alert("Failed to create lead: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ── helpers ── */
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);

  const fmtDate = (d) => {
    if (!d) return "--";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  /* ══════════════════════════════════════ */

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      {/* ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* ── header ── */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} /> Home
            </Link>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Lead Management
              </h1>
              <p className="text-sm text-white/40">
                Track and manage your sales pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
              />
            </div>

            {/* view toggle */}
            <div className="flex rounded-xl border border-white/10 bg-white/5">
              <button
                onClick={() => setView("pipeline")}
                className={`rounded-l-xl px-3 py-2.5 transition ${view === "pipeline" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setView("table")}
                className={`rounded-r-xl px-3 py-2.5 transition ${view === "table" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
              >
                <List size={16} />
              </button>
            </div>

            {/* add button */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            >
              <Plus size={16} /> Add Lead
            </button>
          </div>
        </div>

        {/* ── stats ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            {
              label: "Total Leads",
              value: leads.length,
              icon: Users,
              color: "text-primary",
            },
            {
              label: "Qualified",
              value: stageCounts.qualified || 0,
              icon: TrendingUp,
              color: "text-yellow-400",
            },
            {
              label: "In Proposal",
              value: stageCounts.proposal || 0,
              icon: Filter,
              color: "text-purple-400",
            },
            {
              label: "Pipeline Value",
              value: fmt(pipelineValue),
              icon: DollarSign,
              color: "text-accent",
            },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="glass noise relative overflow-hidden rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/40">{s.label}</div>
                  <div className="mt-1 text-2xl font-bold">{s.value}</div>
                </div>
                <s.icon size={24} className={`${s.color} opacity-60`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── loading ── */}
        {loading && (
          <div className="py-20 text-center text-white/40">
            Loading leads...
          </div>
        )}

        {/* ══════════ PIPELINE VIEW ══════════ */}
        {!loading && view === "pipeline" && (
          <div className="grid gap-4 overflow-x-auto md:grid-cols-3 lg:grid-cols-6">
            {STAGES.map((stage) => {
              const stageLeads = filtered.filter((l) => l.stage === stage);
              return (
                <div key={stage} className="min-w-[220px]">
                  {/* column header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STAGE_COLORS[stage] || "bg-white/10 text-white/60"}`}
                      >
                        {stage.replace("-", " ")}
                      </span>
                    </div>
                    <span className="text-xs text-white/30">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* cards */}
                  <div className="space-y-3">
                    {stageLeads.map((lead) => (
                      <Link key={lead.id || lead._id} href={`/leads/${lead.id || lead._id}`}>
                        <div className="glass noise cursor-pointer overflow-hidden rounded-xl p-3 transition hover:border-white/20">
                          <div className="mb-1 text-sm font-semibold truncate">
                            {lead.name || "Unnamed"}
                          </div>
                          {lead.company && (
                            <div className="mb-2 text-xs text-white/40 truncate">
                              {lead.company}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            {lead.amount ? (
                              <span className="text-xs font-medium text-accent">
                                {fmt(lead.amount)}
                              </span>
                            ) : (
                              <span className="text-xs text-white/20">--</span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[lead.status] || "bg-white/10 text-white/50"}`}
                            >
                              {lead.status || "new"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-white/20">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════ TABLE VIEW ══════════ */}
        {!loading && view === "table" && (
          <div className="glass noise overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {[
                      { key: "name", label: "Name" },
                      { key: "company", label: "Company" },
                      { key: "email", label: "Email" },
                      { key: "stage", label: "Stage" },
                      { key: "status", label: "Status" },
                      { key: "amount", label: "Amount" },
                      { key: "createdAt", label: "Created" },
                    ].map((c) => (
                      <th
                        key={c.key}
                        onClick={() => toggleSort(c.key)}
                        className="cursor-pointer whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 transition hover:text-white/70"
                      >
                        {c.label}
                        <SortIcon col={c.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-white/30"
                      >
                        {search ? "No matching leads found." : "No leads yet. Click 'Add Lead' to get started."}
                      </td>
                    </tr>
                  )}
                  {sorted.map((lead) => (
                    <tr
                      key={lead.id || lead._id}
                      className="border-b border-white/5 transition hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/leads/${lead.id || lead._id}`}
                          className="font-medium text-white hover:text-accent"
                        >
                          {lead.name || "Unnamed"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {lead.company || "--"}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {lead.email || "--"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STAGE_COLORS[lead.stage] || "bg-white/10 text-white/50"}`}
                        >
                          {(lead.stage || "inquiry").replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[lead.status] || "bg-white/10 text-white/50"}`}
                        >
                          {lead.status || "new"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {lead.amount ? fmt(lead.amount) : "--"}
                      </td>
                      <td className="px-4 py-3 text-white/40">
                        {fmtDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ ADD LEAD MODAL ══════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="glass noise w-full max-w-lg overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* modal header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h2 className="text-lg font-bold">Add New Lead</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* modal body */}
              <form onSubmit={handleCreate} className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* name */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-1 block text-xs text-white/40">
                      Name *
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
                      placeholder="Full name"
                    />
                  </div>

                  {/* email */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-1 block text-xs text-white/40">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
                      placeholder="email@company.com"
                    />
                  </div>

                  {/* phone */}
                  <div>
                    <label className="mb-1 block text-xs text-white/40">
                      Phone
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {/* company */}
                  <div>
                    <label className="mb-1 block text-xs text-white/40">
                      Company
                    </label>
                    <input
                      value={form.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
                      placeholder="Acme Inc."
                    />
                  </div>

                  {/* title */}
                  <div>
                    <label className="mb-1 block text-xs text-white/40">
                      Title
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
                      placeholder="VP of Sales"
                    />
                  </div>

                  {/* source */}
                  <div>
                    <label className="mb-1 block text-xs text-white/40">
                      Source
                    </label>
                    <select
                      value={form.source}
                      onChange={(e) => updateField("source", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50"
                    >
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="cold-outreach">Cold Outreach</option>
                      <option value="event">Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* stage */}
                  <div>
                    <label className="mb-1 block text-xs text-white/40">
                      Stage
                    </label>
                    <select
                      value={form.stage}
                      onChange={(e) => updateField("stage", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("-", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* priority */}
                  <div>
                    <label className="mb-1 block text-xs text-white/40">
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => updateField("priority", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* amount */}
                  <div>
                    <label className="mb-1 block text-xs text-white/40">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => updateField("amount", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
                      placeholder="10000"
                    />
                  </div>

                  {/* notes */}
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-white/40">
                      Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
                      placeholder="Additional context..."
                    />
                  </div>
                </div>

                {/* actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Lead"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
