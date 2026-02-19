import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Send,
  ChevronDown,
  Eye,
  FileSignature,
  CreditCard,
  Key,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  "https://moltbot-triage-engine.jamarr.workers.dev/api/recruitment";
const POLL_INTERVAL = 30_000;

// Engagement Tiers (mirrors backend ENGAGEMENT_TIERS)
const TIERS = [
  { id: "pilot", label: "Pilot / Mid-Market", desc: "$2K/mo + 15% commission" },
  { id: "standard", label: "Standard", desc: "$4K/mo + 17% commission" },
  { id: "enterprise", label: "Enterprise", desc: "$6K/mo + 20% commission" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtDate = (iso) => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

// ---------------------------------------------------------------------------
// Gate Badge Component
// ---------------------------------------------------------------------------

const gateConfig = {
  // SOW gates
  sow_pending: { label: "SOW Pending", color: "text-white/40", bg: "bg-white/5", icon: Clock },
  sow_sent: { label: "SOW Sent", color: "text-cyan-400", bg: "bg-cyan-500/20", icon: FileSignature },
  sow_signed: { label: "SOW Signed", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle2 },
  sow_failed: { label: "SOW Failed", color: "text-red-400", bg: "bg-red-500/20", icon: XCircle },

  // Connect gates
  connect_pending: { label: "Connect Pending", color: "text-white/40", bg: "bg-white/5", icon: Clock },
  connect_onboarding: { label: "W-9 In Progress", color: "text-cyan-400", bg: "bg-cyan-500/20", icon: CreditCard },
  connect_received: { label: "W-9 Received", color: "text-amber-400", bg: "bg-amber-500/20", icon: CreditCard },
  connect_verified: { label: "W-9 Verified", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: ShieldCheck },
  connect_failed: { label: "Connect Failed", color: "text-red-400", bg: "bg-red-500/20", icon: XCircle },

  // Billing gates
  billing_pending: { label: "Billing Pending", color: "text-white/40", bg: "bg-white/5", icon: Clock },
  billing_active: { label: "Retainer Active", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle2 },
  billing_failed: { label: "Billing Failed", color: "text-red-400", bg: "bg-red-500/20", icon: XCircle },

  // Welcome Email gates
  welcomeEmail_pending: { label: "Email Pending", color: "text-white/40", bg: "bg-white/5", icon: Clock },
  welcomeEmail_sent: { label: "Email Sent", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: Mail },
  welcomeEmail_failed: { label: "Email Failed", color: "text-red-400", bg: "bg-red-500/20", icon: XCircle },

  // System Access gates
  system_locked: { label: "Access Locked", color: "text-amber-400", bg: "bg-amber-500/20", icon: Key },
  system_provisioned: { label: "Access Live", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle2 },
};

function GateBadge({ gateKey }) {
  const cfg = gateConfig[gateKey] ?? gateConfig.sow_pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Overall Status Badge
// ---------------------------------------------------------------------------

const overallConfig = {
  in_progress: { label: "In Progress", color: "text-cyan-400", bg: "bg-cyan-500/20", dot: "bg-cyan-400" },
  complete: { label: "Complete", color: "text-emerald-400", bg: "bg-emerald-500/20", dot: "bg-emerald-400" },
  partial_failure: { label: "Partial Failure", color: "text-amber-400", bg: "bg-amber-500/20", dot: "bg-amber-400" },
};

function OverallBadge({ status }) {
  const cfg = overallConfig[status] ?? overallConfig.in_progress;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// API Layer
// ---------------------------------------------------------------------------

async function deployOnboarding(formData, authToken) {
  const res = await fetch(`${API_BASE}/onboard-sp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(formData),
  });
  return res.json();
}

async function fetchPipeline(authToken) {
  const res = await fetch(`${API_BASE}/onboarding-pipeline`, {
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  return res.json();
}

async function refreshSPStatus(email, authToken) {
  const res = await fetch(`${API_BASE}/onboarding/${encodeURIComponent(email)}/refresh`, {
    method: "POST",
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Initiation Form
// ---------------------------------------------------------------------------

function OnboardingForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    tier: "pilot",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit = form.name.trim() && form.email.trim() && form.phone.trim() && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const token = sessionStorage.getItem("ceo_token") || localStorage.getItem("ceo_token");
      const data = await deployOnboarding(form, token);

      if (data.error && !data.record) {
        setError(data.error);
      } else {
        setResult(data);
        setForm({ name: "", email: "", phone: "", tier: "pilot" });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <motion.div variants={fadeUp} className="glass noise rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
          <UserPlus size={20} className="text-teal-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Deploy SP Onboarding</h3>
          <p className="text-white/40 text-sm">Trigger Clawbot to execute Legal + Financial + System onboarding</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Legal Name
            </label>
            <div className="relative">
              <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                placeholder="Sarah Chen"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/20 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="sarah@techflow.io"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/20 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Phone + Tier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                placeholder="+16027960177"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/20 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Engagement Tier
            </label>
            <div className="relative">
              <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <select
                value={form.tier}
                onChange={update("tier")}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all text-sm appearance-none cursor-pointer"
              >
                {TIERS.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#161a27] text-white">
                    {t.label} \u2014 {t.desc}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`
            w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
            transition-all duration-200
            ${canSubmit
              ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/20"
              : "bg-white/5 text-white/30 cursor-not-allowed"
            }
          `}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Deploying Clawbot Onboarding...
            </>
          ) : (
            <>
              <Send size={18} />
              Deploy Clawbot Onboarding
            </>
          )}
        </button>
      </form>

      {/* Success Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-sm">Onboarding Deployed</span>
            </div>
            <p className="text-white/60 text-xs">
              {result.record?.spName} ({result.record?.spEmail}) \u2014 Clawbot is executing Legal, Financial, and System gates.
              Monitor progress in the ledger below.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={18} className="text-red-400" />
              <span className="text-red-400 font-semibold text-sm">Deployment Failed</span>
            </div>
            <p className="text-white/60 text-xs">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Row (Monitoring Ledger)
// ---------------------------------------------------------------------------

function PipelineRow({ record, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const token = sessionStorage.getItem("ceo_token") || localStorage.getItem("ceo_token");
      await refreshSPStatus(record.spEmail, token);
      if (onRefresh) onRefresh();
    } catch {
      // Fail silently, ledger will re-poll
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
    >
      {/* Top Row: SP Info + Overall Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-white font-semibold text-sm truncate">{record.spName}</h4>
            <OverallBadge status={record.overallStatus} />
          </div>
          <p className="text-white/40 text-xs truncate">
            {record.spEmail} \u00b7 {record.spPhone || "\u2014"} \u00b7 {record.tier?.toUpperCase() || "PILOT"}
          </p>
          <p className="text-white/30 text-[11px] mt-0.5">
            Initiated {fmtDate(record.initiatedAt)} {fmtTime(record.initiatedAt)} by {record.initiatedBy || "CEO"}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-teal-400 transition-all"
          title="Refresh onboarding status"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Gate Badges */}
      <div className="flex flex-wrap gap-2">
        <GateBadge gateKey={`sow_${record.sowStatus}`} />
        <GateBadge gateKey={`connect_${record.connectStatus}`} />
        <GateBadge gateKey={`billing_${record.billingStatus}`} />
        <GateBadge gateKey={`welcomeEmail_${record.welcomeEmailStatus ?? 'pending'}`} />
        <GateBadge gateKey={`system_${record.systemAccessStatus}`} />
      </div>

      {/* Error Details (if any) */}
      {(record.sowError || record.connectError || record.billingError || record.welcomeEmailError) && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-red-400 text-xs font-medium">Gate Failures</span>
          </div>
          <div className="space-y-0.5">
            {record.sowError && (
              <p className="text-white/50 text-[11px]"><span className="text-red-400">SOW:</span> {record.sowError}</p>
            )}
            {record.connectError && (
              <p className="text-white/50 text-[11px]"><span className="text-red-400">Connect:</span> {record.connectError}</p>
            )}
            {record.billingError && (
              <p className="text-white/50 text-[11px]"><span className="text-red-400">Billing:</span> {record.billingError}</p>
            )}
            {record.welcomeEmailError && (
              <p className="text-white/50 text-[11px]"><span className="text-red-400">Email:</span> {record.welcomeEmailError}</p>
            )}
          </div>
        </div>
      )}

      {/* Connect Onboarding URL (if available) */}
      {record.connectOnboardingUrl && (
        <div className="mt-2 flex items-center gap-2">
          <a
            href={record.connectOnboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 text-xs hover:text-teal-300 underline underline-offset-2 flex items-center gap-1"
          >
            <Eye size={12} />
            Stripe Connect Onboarding Link
          </a>
        </div>
      )}

      {/* SOW Signing URL (if available) */}
      {record.sowSigningUrl && (
        <div className="mt-1 flex items-center gap-2">
          <a
            href={record.sowSigningUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 text-xs hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1"
          >
            <FileSignature size={12} />
            DocuSign Signing Link
          </a>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Monitoring Ledger
// ---------------------------------------------------------------------------

function OnboardingLedger({ refreshTick }) {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("ceo_token") || localStorage.getItem("ceo_token");
      const data = await fetchPipeline(token);
      if (data.pipeline) {
        setPipeline(data.pipeline);
        setError(null);
      } else if (data.error) {
        setError(data.error);
      }
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Re-fetch when a new onboarding is deployed
  useEffect(() => {
    if (refreshTick > 0) {
      fetchData();
    }
  }, [refreshTick, fetchData]);

  // Stats
  const inProgress = pipeline.filter((r) => r.overallStatus === "in_progress").length;
  const complete = pipeline.filter((r) => r.overallStatus === "complete").length;
  const failed = pipeline.filter((r) => r.overallStatus === "partial_failure").length;

  return (
    <motion.div variants={fadeUp} className="space-y-4">
      {/* Ledger Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <Eye size={20} className="text-teal-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Onboarding Pipeline</h3>
            <p className="text-white/40 text-sm">
              {pipeline.length} total \u00b7 {inProgress} in progress \u00b7 {complete} complete \u00b7 {failed} issues
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-white/20 text-[11px]">
              {fmtTime(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-teal-400 transition-all"
            title="Refresh pipeline"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass noise rounded-xl p-3 border border-cyan-500/20">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-cyan-400 text-2xl font-bold">{inProgress}</p>
        </div>
        <div className="glass noise rounded-xl p-3 border border-emerald-500/20">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Complete</p>
          <p className="text-emerald-400 text-2xl font-bold">{complete}</p>
        </div>
        <div className="glass noise rounded-xl p-3 border border-amber-500/20">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Issues</p>
          <p className="text-amber-400 text-2xl font-bold">{failed}</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && pipeline.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-teal-400 animate-spin" />
          <span className="text-white/40 text-sm ml-3">Loading onboarding pipeline...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && pipeline.length === 0 && !error && (
        <div className="glass noise rounded-xl p-8 border border-white/10 text-center">
          <UserPlus size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No Sovereign Professionals onboarded yet.</p>
          <p className="text-white/20 text-xs mt-1">Use the form above to deploy Clawbot onboarding.</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass noise rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Pipeline Rows */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
        {pipeline.map((record) => (
          <PipelineRow key={record.spEmail} record={record} onRefresh={fetchData} />
        ))}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// SPOnboardingContent (Named Export — for CEO Dashboard tab embedding)
// ---------------------------------------------------------------------------

export function SPOnboardingContent() {
  const [refreshTick, setRefreshTick] = useState(0);

  const handleDeploySuccess = () => {
    setRefreshTick((t) => t + 1);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6 p-6"
    >
      {/* Gradient Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <UserPlus size={18} className="text-teal-400" />
          </div>
          <h2 className="text-xl font-bold text-white">SP Onboarding</h2>
        </div>
        <p className="text-white/40 text-sm ml-11">
          Deploy and monitor Sovereign Professional onboarding \u2014 Legal, Financial, and System gates
        </p>
      </motion.div>

      {/* Initiation Form */}
      <OnboardingForm onSuccess={handleDeploySuccess} />

      {/* Monitoring Ledger */}
      <OnboardingLedger refreshTick={refreshTick} />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Default Export (Standalone page — for direct route access)
// ---------------------------------------------------------------------------

export default function SPOnboarding() {
  const [refreshTick, setRefreshTick] = useState(0);

  const handleDeploySuccess = () => {
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          {/* Page Header */}
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <a href="/ceo" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60"><path d="m15 18-6-6 6-6"/></svg>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-white">SP Onboarding</h1>
              <p className="text-white/40 text-sm">Clawbot Autonomous Onboarding Engine</p>
            </div>
          </motion.div>

          {/* Form */}
          <OnboardingForm onSuccess={handleDeploySuccess} />

          {/* Ledger */}
          <OnboardingLedger refreshTick={refreshTick} />
        </motion.div>
      </div>
    </div>
  );
}
