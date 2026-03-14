import { useState, useEffect } from "react";
import {
  Shield,
  Briefcase,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Zap,
  BookOpen,
  Target,
  TrendingUp,
  Building2,
} from "lucide-react";
import { fetchMyLeads } from "../lib/sp-client";
import DealRoomModal from "../components/DealRoomModal";

// ---------------------------------------------------------------------------
// Epic 32: SP Portal — Sovereign Professional Command Dashboard
// ---------------------------------------------------------------------------

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

const STAGE_COLORS = {
  discovery:    "text-cyan-400",
  proposal:     "text-amber-400",
  negotiation:  "text-orange-400",
  contract:     "text-violet-400",
  closed_won:   "text-emerald-400",
  closed_lost:  "text-red-400",
};

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0,
});

function getCallerEmail() {
  try {
    const spToken = sessionStorage.getItem("rsllc_sp_token");
    const ceoJwt = sessionStorage.getItem("rsllc_ceo_jwt");
    const jwt = spToken || ceoJwt;
    if (!jwt) return "";
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    return payload.email || payload.sub || "";
  } catch { return ""; }
}

// ---------------------------------------------------------------------------
// SOP Runbook — Embedded Protocol Text
// ---------------------------------------------------------------------------

const SOP_SECTIONS = [
  {
    title: "1. Initial Briefing Review",
    content: `When a lead is assigned to you, open the Deal Room immediately. Review the Context Briefing carefully: it contains AI-generated intelligence about the prospect's company, role, likely pain points, and recommended approach angles. This is your strategic advantage — use it.`,
  },
  {
    title: "2. First Contact (Within 24 Hours)",
    content: `Make contact within 24 hours of assignment. Use the prospect's preferred channel (email or phone, shown in the Deal Room). Reference something specific about their business from the Context Briefing to demonstrate you've done your homework. Your goal is to book a 15-minute discovery call, not to pitch.`,
  },
  {
    title: "3. Discovery Call Protocol",
    content: `On the discovery call: Listen 80%, talk 20%. Ask about their current challenges, budget cycle timing, and decision-making process. Update the Deal Room with notes immediately after the call. Move the deal stage to "proposal" if they express genuine interest with budget authority.`,
  },
  {
    title: "4. Proposal & Negotiation",
    content: `Use the SOW Generator in the Deal Room to create a Statement of Work. Price according to the engagement tier shown in your briefing. Do NOT discount more than 10% without CEO approval. Update TCV in the Deal Room as terms are finalized. Move to "contract" stage when verbal agreement is reached.`,
  },
  {
    title: "5. Deal Closure & Handoff",
    content: `When the prospect signs: update status to "closed_won" and ensure TCV is accurate. The system will automatically generate the commission payout and trigger the client onboarding sequence. Your commission hits escrow immediately and releases after the 30-day satisfaction window.`,
  },
  {
    title: "6. Status Codes",
    content: `new = Freshly assigned, not yet contacted
contacted = First outreach made, awaiting response
qualified = Discovery complete, genuine opportunity confirmed
proposal = SOW sent or pricing discussed
negotiation = Active back-and-forth on terms
closed_won = Deal signed and payment received
closed_lost = Prospect declined or went dark (add note explaining why)
released = You've returned this lead to the reservoir for reassignment`,
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SPPortal() {
  const [leads, setLeads] = useState([]);
  const [pipelineArr, setPipelineArr] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sopOpen, setSopOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const spEmail = getCallerEmail();

  useEffect(() => {
    if (!spEmail) {
      setError("No session found. Please log in via your partner dashboard.");
      setLoading(false);
      return;
    }
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyLeads(spEmail);
      setLeads(res.leads || []);
      setPipelineArr(res.pipeline_arr || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Count leads by status
  const activeLeads = leads.filter((l) => !["closed_won", "closed_lost", "released"].includes(l.status));
  const wonLeads = leads.filter((l) => l.status === "closed_won");

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ── Header ── */}
      <div className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Shield size={20} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">SP Command Portal</h1>
              <p className="text-xs text-white/30 font-mono">{spEmail || "Not authenticated"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/partner"
              className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-xs text-white/50 hover:text-white/80 hover:bg-slate-800 transition-colors"
            >
              Partner Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Pipeline KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            icon={<Target size={16} className="text-cyan-400" />}
            label="Assigned Leads"
            value={leads.length}
            color="text-cyan-400"
          />
          <KPICard
            icon={<Briefcase size={16} className="text-amber-400" />}
            label="Active Pipeline"
            value={activeLeads.length}
            color="text-amber-400"
          />
          <KPICard
            icon={<TrendingUp size={16} className="text-emerald-400" />}
            label="Pipeline ARR"
            value={usdFmt.format(pipelineArr)}
            color="text-emerald-400"
          />
          <KPICard
            icon={<DollarSign size={16} className="text-violet-400" />}
            label="Deals Won"
            value={wonLeads.length}
            color="text-violet-400"
          />
        </div>

        {/* ── SOP Runbook (Collapsible) ── */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
          <button
            onClick={() => setSopOpen(!sopOpen)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <BookOpen size={16} className="text-amber-400" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-white">Sovereign Professional Deal Room Protocol</h2>
                <p className="text-[10px] text-white/30">Standard Operating Procedure for SP Lead Management</p>
              </div>
            </div>
            {sopOpen ? (
              <ChevronUp size={16} className="text-white/30" />
            ) : (
              <ChevronDown size={16} className="text-white/30" />
            )}
          </button>

          {sopOpen && (
            <div className="px-6 pb-6 space-y-4 border-t border-slate-800/40">
              <div className="pt-4">
                {SOP_SECTIONS.map((section, idx) => (
                  <div key={idx} className="mb-4">
                    <h3 className="text-xs font-bold text-violet-400/80 mb-1.5">{section.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-slate-800/30">
                  <p className="text-[10px] text-white/20 italic">
                    This protocol is your competitive edge. SPs who follow this process close at 3x the rate of those who wing it.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Assigned Deals Table ── */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Users size={16} className="text-cyan-400" />
              </div>
              <h2 className="text-sm font-bold text-white">Your Assigned Deals</h2>
            </div>
            <button
              onClick={loadLeads}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-xs text-white/50 hover:text-white/80 hover:bg-slate-800 transition-colors disabled:opacity-30"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : "Refresh"}
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 size={28} className="text-cyan-400 animate-spin" />
              <span className="text-sm text-white/30">Loading your pipeline...</span>
            </div>
          )}

          {error && (
            <div className="px-6 py-8 text-center">
              <AlertTriangle size={28} className="text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && leads.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Briefcase size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">No leads assigned yet.</p>
              <p className="text-xs text-white/15 mt-1">Leads will appear here once the CEO assigns them to you.</p>
            </div>
          )}

          {!loading && !error && leads.length > 0 && (
            <div className="divide-y divide-slate-800/30">
              {/* Header Row */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-2 text-[10px] text-white/25 uppercase tracking-wider font-bold">
                <div className="col-span-3">Prospect</div>
                <div className="col-span-2">Company</div>
                <div className="col-span-1 text-center">Intent</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-center">Stage</div>
                <div className="col-span-2 text-right">TCV</div>
              </div>

              {/* Lead Rows */}
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="w-full grid grid-cols-12 gap-2 px-6 py-3 hover:bg-slate-800/30 transition-colors text-left items-center"
                >
                  <div className="col-span-3">
                    <p className="text-xs font-medium text-white/80 truncate">{lead.prospect_name || "Unknown"}</p>
                    <p className="text-[10px] text-white/25 truncate md:hidden">{lead.prospect_company || ""}</p>
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <p className="text-xs text-white/40 truncate flex items-center gap-1">
                      <Building2 size={10} className="text-white/20 shrink-0" />
                      {lead.prospect_company || "—"}
                    </p>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs font-mono text-amber-400/80 flex items-center justify-center gap-0.5">
                      <Zap size={10} className="text-amber-400/50" />
                      {lead.intent_score ?? "—"}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
                      {lead.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-xs font-medium ${STAGE_COLORS[lead.stage] || "text-white/30"}`}>
                      {lead.stage?.replace(/_/g, " ") || "—"}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-mono text-emerald-400/80">
                      {lead.tcv ? usdFmt.format(lead.tcv) : "—"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Deal Room Modal (SP Mode) ── */}
      {selectedLeadId && (
        <DealRoomModal
          leadId={selectedLeadId}
          onClose={() => {
            setSelectedLeadId(null);
            loadLeads(); // refresh pipeline after deal room changes
          }}
          spMode={true}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card Sub-Component
// ---------------------------------------------------------------------------

function KPICard({ icon, label, value, color }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
