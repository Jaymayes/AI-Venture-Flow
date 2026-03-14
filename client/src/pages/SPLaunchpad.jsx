/**
 * SPLaunchpad.jsx — Sovereign Professional Launchpad Dashboard
 *
 * The authenticated landing page for Sovereign Professionals. Combines:
 *   1. EscalationInbox — High-intent leads (>= 85/100) with Full Context Briefing
 *   2. PodMetrics — Real-time FinOps telemetry (CPL, margin, pipeline value)
 *   3. PartnerStatus — Engagement tier, SOW status, commission details
 *
 * Auth flow:
 *   - Wrapped by AuthProvider (in-memory JWT token)
 *   - If not authenticated, shows PIN entry gate
 *   - On successful auth, renders the 3-panel dashboard layout
 *   - 401/403 from any API call triggers logout → back to PIN gate
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Rocket,
  Target,
  Activity,
  Award,
  LogOut,
} from "lucide-react";
import AuthProvider, { useAuth } from "../contexts/AuthContext";
import EscalationInbox from "../components/EscalationInbox";
import PodMetrics from "../components/PodMetrics";
import PartnerStatus from "../components/PartnerStatus";

// ---------------------------------------------------------------------------
// Tab Navigation
// ---------------------------------------------------------------------------

const TABS = [
  { key: "escalations", label: "Escalation Inbox", icon: Target, color: "text-red-400" },
  { key: "metrics", label: "Pod Telemetry", icon: Activity, color: "text-primary" },
  { key: "status", label: "Partner Status", icon: Award, color: "text-amber-400" },
];

// ---------------------------------------------------------------------------
// Auth Gate (Email Entry UI)
// ---------------------------------------------------------------------------

function LaunchpadAuthGate() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    const result = await login(trimmed, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed.");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 glass noise rounded-2xl p-8 w-full max-w-md border border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Rocket size={32} className="text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center gradient-text mb-1">
          SP Launchpad
        </h1>
        <p className="text-white/40 text-sm text-center mb-8">
          Referral Service LLC &mdash; Sovereign Professional Portal
        </p>

        {/* Identity badge */}
        <div className="glass noise rounded-xl p-4 mb-6 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-bold text-sm">
              SP
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Sovereign Professional</p>
              <p className="text-white/30 text-xs">Strategic Growth Partner</p>
            </div>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white/50 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Mail size={16} className="text-white/30" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="you@example.com"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/50 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Lock size={16} className="text-white/30" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Enter password"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-lg p-3 text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Sign In"}
          </button>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Referral Service LLC
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Layout
// ---------------------------------------------------------------------------

function LaunchpadDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("escalations");

  return (
    <div className="min-h-screen relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[160px]" />
        <div className="absolute bottom-0 -right-40 h-[500px] w-[500px] rounded-full bg-accent/8 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors cursor-pointer">
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Home</span>
              </div>
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15">
                <Rocket size={16} className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">SP Launchpad</h1>
                <p className="text-[10px] text-white/25">Clawbot Autonomous B2B Unit</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs border border-white/10 hover:bg-white/10 hover:text-white/60 transition"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 p-1 glass noise rounded-xl mb-6 overflow-x-auto">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white/10 text-white border border-white/10 shadow-lg"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
                }`}
              >
                <TabIcon size={14} className={isActive ? tab.color : ""} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "escalations" && <EscalationInbox />}
          {activeTab === "metrics" && <PodMetrics />}
          {activeTab === "status" && <PartnerStatus />}
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root — Wraps everything in AuthProvider
// ---------------------------------------------------------------------------

export default function SPLaunchpad() {
  return (
    <AuthProvider>
      <SPLaunchpadInner />
    </AuthProvider>
  );
}

function SPLaunchpadInner() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LaunchpadAuthGate />;
  }

  return <LaunchpadDashboard />;
}
