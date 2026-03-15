import { useState, useEffect, useRef } from "react";
import {
  X,
  Building2,
  Mail,
  Phone,
  User,
  FileText,
  DollarSign,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  MessageSquare,
  Shield,
  Zap,
  Brain,
} from "lucide-react";
import { fetchDeal, patchDeal, addDealNote, fetchSpDeal, patchSpDeal, addSpDealNote } from "../lib/sp-client";

// ---------------------------------------------------------------------------
// Epic 28: Deal Room Modal — Full Lead Profile + Notes + Status Mgmt
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  "new", "contacted", "qualified", "proposal",
  "negotiation", "closed_won", "closed_lost", "released",
];

const STAGE_OPTIONS = [
  "discovery", "proposal", "negotiation", "contract", "closed_won", "closed_lost",
];

const STATUS_COLORS = {
  new:          "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  contacted:    "bg-blue-500/15 text-blue-400 border-blue-500/25",
  qualified:    "bg-violet-500/15 text-violet-400 border-violet-500/25",
  proposal:     "bg-amber-500/15 text-amber-400 border-amber-500/25",
  negotiation:  "bg-orange-500/15 text-orange-400 border-orange-500/25",
  closed_won:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  closed_lost:  "bg-red-500/15 text-red-400 border-red-500/25",
  released:     "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

const PAYMENT_COLORS = {
  paid:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
};

function getCallerEmail() {
  try {
    const jwt = sessionStorage.getItem("rsllc_ceo_jwt");
    if (!jwt) return "";
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    return payload.email || payload.sub || "";
  } catch { return ""; }
}

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0,
});

export default function DealRoomModal({ leadId, onClose, spMode = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [flash, setFlash] = useState(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [assigning, setAssigning] = useState(false);
  const noteInputRef = useRef(null);

  const spEmail = getCallerEmail();

  // Fetch deal data
  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    const fetchFn = spMode ? fetchSpDeal : fetchDeal;
    fetchFn(leadId, spEmail)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleStatusChange(newStatus) {
    setSaving(true);
    try {
      await (spMode ? patchSpDeal : patchDeal)(leadId, { status: newStatus }, spEmail);
      setData((prev) => ({
        ...prev,
        lead: { ...prev.lead, status: newStatus },
      }));
      showFlash("Status updated");
    } catch (err) {
      showFlash(`Error: ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleStageChange(newStage) {
    setSaving(true);
    try {
      await (spMode ? patchSpDeal : patchDeal)(leadId, { stage: newStage }, spEmail);
      setData((prev) => ({
        ...prev,
        deal: prev.deal ? { ...prev.deal, stage: newStage } : { stage: newStage },
      }));
      showFlash("Deal stage updated");
    } catch (err) {
      showFlash(`Error: ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const result = await (spMode ? addSpDealNote : addDealNote)(leadId, newNote.trim(), spEmail);
      setData((prev) => ({
        ...prev,
        notes: [result.note, ...prev.notes],
      }));
      setNewNote("");
      showFlash("Note added");
    } catch (err) {
      showFlash(`Error: ${err.message}`, true);
    } finally {
      setAddingNote(false);
    }
  }

  async function handleAssignSP() {
    if (!assignEmail.trim()) return;
    setAssigning(true);
    try {
      await patchDeal(leadId, { partner_email: assignEmail.trim() }, spEmail);
      setData((prev) => ({
        ...prev,
        lead: { ...prev.lead, partner_email: assignEmail.trim() },
      }));
      setAssignEmail("");
      showFlash(`Assigned to ${assignEmail.trim()} — Slack notified`);
    } catch (err) {
      showFlash(`Error: ${err.message}`, true);
    } finally {
      setAssigning(false);
    }
  }

  function showFlash(msg, isError = false) {
    setFlash({ msg, isError });
    setTimeout(() => setFlash(null), 3000);
  }

  // ── Render ──

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Briefcase size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Deal Room</h2>
              <p className="text-[10px] text-white/30">Lead #{leadId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white/50" />
          </button>
        </div>

        {/* Flash Banner */}
        {flash && (
          <div className={`px-6 py-2 text-xs font-medium ${flash.isError ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            {flash.isError ? <AlertTriangle size={12} className="inline mr-1" /> : <CheckCircle2 size={12} className="inline mr-1" />}
            {flash.msg}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 size={28} className="text-cyan-400 animate-spin" />
              <span className="text-sm text-white/30">Loading deal data…</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center">
              <AlertTriangle size={28} className="text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* ── Lead Profile Card ── */}
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                    <User size={14} className="text-cyan-400" />
                    {data.lead.prospect_name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[data.lead.status] || STATUS_COLORS.new}`}>
                    {data.lead.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-white/50">
                    <Building2 size={12} className="text-white/25 shrink-0" />
                    {data.lead.prospect_company ? (
                      <a
                        href={data.lead.prospect_company.includes("://") ? data.lead.prospect_company : `https://${data.lead.prospect_company}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
                      >
                        {data.lead.prospect_company}
                      </a>
                    ) : (
                      <span className="truncate">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <Briefcase size={12} className="text-white/25 shrink-0" />
                    <span className="truncate">{data.lead.prospect_role || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <Mail size={12} className="text-white/25 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{data.lead.prospect_email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <Phone size={12} className="text-white/25 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{data.lead.prospect_phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <Zap size={12} className="text-amber-400/60 shrink-0" />
                    <span>Intent: <strong className="text-amber-400">{data.lead.intent_score}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <Clock size={12} className="text-white/25 shrink-0" />
                    <span>{timeAgo(data.lead.created_at)}</span>
                  </div>
                </div>
                {data.lead.partner_email && (
                  <div className="pt-2 border-t border-slate-800/40 flex items-center gap-2 text-xs text-white/40">
                    <Shield size={12} className="text-violet-400/60" />
                    Assigned to: <span className="font-mono text-violet-400/80">{data.lead.partner_email}</span>
                  </div>
                )}
              </div>

              {/* ── AI Intelligence & Deep Research (Epic 39) ── */}
              {data.research?.research_summary && (
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                    <Brain size={14} className="text-indigo-400" />
                    AI Intelligence & Deep Research
                    {data.research.research_score != null && (
                      <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                        Score: {data.research.research_score}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                    {data.research.research_summary}
                  </p>
                </div>
              )}

              {/* ── Deal Room / Payment ── */}
              {data.dealRoom && (
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                    <DollarSign size={14} className="text-emerald-400" />
                    Deal Room
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-white/50">TCV: <strong className="text-emerald-400 font-mono">{usdFmt.format(data.dealRoom.tcv)}</strong></span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${PAYMENT_COLORS[data.dealRoom.payment_status] || PAYMENT_COLORS.pending}`}>
                      {data.dealRoom.payment_status}
                    </span>
                    {data.dealRoom.sow_signed_at && (
                      <span className="text-white/40">Signed: {new Date(data.dealRoom.sow_signed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  {data.dealRoom.sow_markdown && (
                    <details className="pt-2">
                      <summary className="text-[10px] text-cyan-400/60 cursor-pointer hover:text-cyan-400">View SOW</summary>
                      <pre className="mt-2 text-[11px] text-white/40 bg-slate-950 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {data.dealRoom.sow_markdown}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* ── Status & Stage Controls ── */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider font-bold block mb-2">Lead Status</label>
                  <select
                    value={data.lead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={saving}
                    className="w-full bg-slate-800/80 border border-slate-700/50 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider font-bold block mb-2">Deal Stage</label>
                  <select
                    value={data.deal?.stage || "discovery"}
                    onChange={(e) => handleStageChange(e.target.value)}
                    disabled={saving}
                    className="w-full bg-slate-800/80 border border-slate-700/50 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                  >
                    {STAGE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Epic 29: SP Assignment (CEO only — hidden in SP mode) ── */}
              {!spMode && <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-bold block mb-2">
                  Assign Sovereign Professional
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !assigning) handleAssignSP(); }}
                    placeholder={data.lead.partner_email || "sp@referralsvc.com"}
                    className="flex-1 bg-slate-800/80 border border-slate-700/50 text-white text-xs rounded-lg px-3 py-2 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 font-mono"
                  />
                  <button
                    onClick={handleAssignSP}
                    disabled={assigning || !assignEmail.trim()}
                    className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-30 transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    {assigning ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                    Assign
                  </button>
                </div>
                {data.lead.partner_email && (
                  <p className="text-[10px] text-white/25 mt-2">
                    Currently assigned: <span className="text-violet-400/60 font-mono">{data.lead.partner_email}</span>
                  </p>
                )}
              </div>}

              {/* ── Context Briefing ── */}
              {data.lead.context_briefing && (
                <details className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                  <summary className="text-sm font-bold text-white/80 flex items-center gap-2 cursor-pointer">
                    <FileText size={14} className="text-amber-400" />
                    Context Briefing
                  </summary>
                  <pre className="mt-3 text-[11px] text-white/40 bg-slate-950 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {typeof data.lead.context_briefing === "string"
                      ? data.lead.context_briefing
                      : JSON.stringify(data.lead.context_briefing, null, 2)}
                  </pre>
                </details>
              )}

              {/* ── Notes ── */}
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white/80 flex items-center gap-2 mb-3">
                  <MessageSquare size={14} className="text-violet-400" />
                  {spMode ? "Deal Notes" : "CEO Notes"}
                  <span className="text-[10px] text-white/25 font-normal ml-auto">{data.notes.length} note{data.notes.length !== 1 ? "s" : ""}</span>
                </h3>

                {/* Add Note Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    ref={noteInputRef}
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !addingNote) handleAddNote(); }}
                    placeholder="Add a note…"
                    className="flex-1 bg-slate-800/80 border border-slate-700/50 text-white text-xs rounded-lg px-3 py-2 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="px-3 py-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-30 transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    {addingNote ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Add
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.notes.length === 0 && (
                    <p className="text-[11px] text-white/20 text-center py-4">No notes yet. Be the first.</p>
                  )}
                  {data.notes.map((note) => (
                    <div key={note.id} className="bg-slate-950/60 rounded-lg px-3 py-2 border border-slate-800/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-violet-400/70">{note.author}</span>
                        <span className="text-[10px] text-white/20">{timeAgo(note.created_at)}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{note.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
