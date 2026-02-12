import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit3,
  Save,
  Trash2,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Star,
  DollarSign,
  MessageSquare,
  Activity,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { apiFetch } from "../lib/api";

/* ── constants ── */
const STAGES = [
  "inquiry",
  "qualified",
  "proposal",
  "negotiation",
  "closed-won",
  "closed-lost",
];
const STAGE_COLORS = {
  inquiry: "bg-blue-500",
  qualified: "bg-yellow-500",
  proposal: "bg-purple-500",
  negotiation: "bg-orange-500",
  "closed-won": "bg-emerald-500",
  "closed-lost": "bg-red-500",
};
const STAGE_BADGE = {
  inquiry: "bg-blue-500/20 text-blue-400",
  qualified: "bg-yellow-500/20 text-yellow-400",
  proposal: "bg-purple-500/20 text-purple-400",
  negotiation: "bg-orange-500/20 text-orange-400",
  "closed-won": "bg-emerald-500/20 text-emerald-400",
  "closed-lost": "bg-red-500/20 text-red-400",
};
const STATUS_BADGE = {
  new: "bg-blue-500/20 text-blue-400",
  active: "bg-emerald-500/20 text-emerald-400",
  stale: "bg-yellow-500/20 text-yellow-400",
  lost: "bg-red-500/20 text-red-400",
};
const PRIORITY_BADGE = {
  low: "bg-slate-500/20 text-slate-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function LeadDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch ── */
  const fetchLead = async () => {
    try {
      const data = await apiFetch("GET", `/api/leads/${id}`);
      setLead(data);
      setForm({ ...data });
    } catch {
      setLead(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  /* ── handlers ── */
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        amount: form.amount ? Number(form.amount) : undefined,
      };
      const updated = await apiFetch("PATCH", `/api/leads/${id}`, body);
      setLead(updated);
      setForm({ ...updated });
      setEditing(false);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch("DELETE", `/api/leads/${id}`);
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setForm({ ...lead });
    setEditing(false);
  };

  /* ── stage pipeline indicator ── */
  const StageIndicator = ({ currentStage }) => {
    const currentIdx = STAGES.indexOf(currentStage);
    return (
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={stage} className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                <div
                  className={`h-3 w-3 rounded-full transition ${
                    isCurrent
                      ? `${STAGE_COLORS[stage]} ring-2 ring-white/30`
                      : isActive
                        ? `${STAGE_COLORS[stage]} opacity-60`
                        : "bg-white/10"
                  }`}
                />
                <span
                  className={`mt-1 text-[10px] capitalize ${
                    isCurrent ? "font-semibold text-white" : "text-white/30"
                  }`}
                >
                  {stage.replace("-", " ")}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`h-0.5 w-4 md:w-8 ${
                    i < currentIdx ? "bg-white/20" : "bg-white/5"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ── inline field ── */
  const Field = ({ label, icon: Icon, field, type = "text", options }) => {
    const value = editing ? form[field] ?? "" : lead[field] ?? "";
    return (
      <div className="flex items-start gap-3 py-3">
        <Icon size={16} className="mt-0.5 shrink-0 text-white/30" />
        <div className="flex-1">
          <div className="text-xs text-white/40">{label}</div>
          {editing ? (
            options ? (
              <select
                value={value}
                onChange={(e) => updateField(field, e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
              >
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o.replace("-", " ")}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={value}
                onChange={(e) => updateField(field, e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
              />
            )
          ) : (
            <div className="mt-0.5 text-sm text-white/80">
              {field === "amount" && value
                ? fmt(Number(value))
                : value || "--"}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ══════════ RENDER ══════════ */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/40">
        Loading lead...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-white/40">Lead not found.</div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const activities = lead.activities || lead.activity || [];
  const chatMessages = lead.messages || lead.chatHistory || [];

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      {/* ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* ── header ── */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {lead.name || "Unnamed Lead"}
              </h1>
              {lead.company && (
                <p className="text-sm text-white/40">{lead.company}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
                >
                  <Edit3 size={16} /> Edit
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/20"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── stage indicator ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="glass noise mb-6 overflow-hidden overflow-x-auto rounded-2xl px-6 py-4"
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
            Pipeline Stage
          </div>
          <StageIndicator currentStage={lead.stage || "inquiry"} />
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── LEFT: lead info card ── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="glass noise relative overflow-hidden rounded-2xl p-6 lg:col-span-1"
          >
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">
              Lead Information
            </h2>

            {/* badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STAGE_BADGE[lead.stage] || "bg-white/10 text-white/50"}`}
              >
                {(lead.stage || "inquiry").replace("-", " ")}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[lead.status] || "bg-white/10 text-white/50"}`}
              >
                {lead.status || "new"}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_BADGE[lead.priority] || "bg-white/10 text-white/50"}`}
              >
                {lead.priority || "medium"}
              </span>
            </div>

            {/* score */}
            {(lead.score !== undefined && lead.score !== null) && (
              <div className="mb-4 flex items-center gap-2">
                <Star size={14} className="text-yellow-400" />
                <span className="text-sm text-white/70">
                  Score: <span className="font-semibold text-white">{lead.score}</span>/100
                </span>
              </div>
            )}

            <div className="divide-y divide-white/5">
              <Field label="Name" icon={Briefcase} field="name" />
              <Field label="Email" icon={Mail} field="email" type="email" />
              <Field label="Phone" icon={Phone} field="phone" />
              <Field label="Company" icon={Building2} field="company" />
              <Field label="Title" icon={Briefcase} field="title" />
              <Field
                label="Stage"
                icon={Activity}
                field="stage"
                options={STAGES}
              />
              <Field
                label="Priority"
                icon={AlertTriangle}
                field="priority"
                options={["low", "medium", "high", "urgent"]}
              />
              <Field
                label="Amount"
                icon={DollarSign}
                field="amount"
                type="number"
              />
            </div>

            {/* notes */}
            <div className="mt-4 border-t border-white/5 pt-4">
              <div className="text-xs text-white/40">Notes</div>
              {editing ? (
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
                />
              ) : (
                <p className="mt-1 text-sm leading-relaxed text-white/60">
                  {lead.notes || "No notes yet."}
                </p>
              )}
            </div>

            {/* dates */}
            <div className="mt-4 border-t border-white/5 pt-4 text-xs text-white/30">
              <div>Created: {fmtDate(lead.createdAt)}</div>
              {lead.updatedAt && (
                <div>Updated: {fmtDate(lead.updatedAt)}</div>
              )}
            </div>
          </motion.div>

          {/* ── RIGHT: activity + chat ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Activity Timeline */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="glass noise relative overflow-hidden rounded-2xl p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/40">
                <Activity size={16} /> Activity Timeline
              </h2>

              {activities.length === 0 ? (
                <div className="py-8 text-center text-sm text-white/20">
                  No activity recorded yet.
                </div>
              ) : (
                <div className="relative space-y-4 pl-6">
                  {/* timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />

                  {activities.map((a, i) => (
                    <div key={i} className="relative">
                      {/* dot */}
                      <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-accent" />
                      <div className="text-sm text-white/70">
                        {a.description || a.text || a.action || JSON.stringify(a)}
                      </div>
                      {(a.timestamp || a.createdAt || a.date) && (
                        <div className="mt-0.5 text-xs text-white/30">
                          {fmtDate(a.timestamp || a.createdAt || a.date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Chat History */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="glass noise relative overflow-hidden rounded-2xl p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/40">
                <MessageSquare size={16} /> Chat History
              </h2>

              {chatMessages.length === 0 ? (
                <div className="py-8 text-center text-sm text-white/20">
                  No chat messages for this lead.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "rounded-br-md bg-gradient-to-r from-primary to-accent text-black"
                            : "rounded-bl-md border border-white/10 bg-white/5 text-white/80"
                        }`}
                      >
                        {m.content || m.text || m.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShowDelete(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass noise w-full max-w-sm overflow-hidden rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold">Delete Lead</h3>
                <p className="text-sm text-white/40">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm text-white/60">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-white">
                {lead.name || "this lead"}
              </span>
              ? All associated data will be removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Lead"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
