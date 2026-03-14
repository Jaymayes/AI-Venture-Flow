import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Database, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "wouter";
import AuthProvider, { useAuth } from "../contexts/AuthContext";
import CEOCrmMonitoring from "./CEOCrmMonitoring";
import SPCrmOperations from "./SPCrmOperations";

// ---------------------------------------------------------------------------
// CRM Gateway — Phase 3: Role-Aware CRM Routing
// ---------------------------------------------------------------------------
// Single entry point for /crm. After authentication:
//   - CEO → renders CEOCrmMonitoring (hits /api/analytics/global)
//   - SP  → renders SPCrmOperations  (hits /api/triage/analytics)
//
// Role is derived from the JWT claims via AuthContext.spProfile.role.
// No hardcoded credentials. No client-side role spoofing possible —
// the backend prefix guard rejects SP JWTs on CEO-only routes regardless.
// ---------------------------------------------------------------------------

export default function CrmGateway() {
  return (
    <AuthProvider>
      <CrmGatewayInner />
    </AuthProvider>
  );
}

function CrmGatewayInner() {
  const { isAuthenticated, spProfile } = useAuth();

  if (!isAuthenticated) {
    return <CrmAuthGate />;
  }

  // Route by role — CEO sees monitoring, SP sees operations
  const role = spProfile?.role;
  if (role === "CEO") {
    return <CEOCrmMonitoring />;
  }
  return <SPCrmOperations />;
}

// ---------------------------------------------------------------------------
// Auth Gate (inline — uses AuthContext.login)
// ---------------------------------------------------------------------------

function CrmAuthGate() {
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
      setError(result.error || "Invalid credentials.");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
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
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 flex items-center justify-center">
            <Database size={32} className="text-cyan-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center gradient-text mb-1">
          CRM Portal
        </h1>
        <p className="text-white/40 text-sm text-center mb-8">
          Referral Service LLC — Role-Aware CRM Access
        </p>

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
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com"
                autoFocus
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all disabled:opacity-50"
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
                disabled={loading}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all disabled:opacity-50"
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Sign In to CRM"}
          </button>
        </form>

        <p className="text-white/20 text-xs text-center mt-4">
          CEO accounts see monitoring dashboards. SP accounts see operations data.
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors">
            <ArrowLeft size={12} /> Back to Referral Service LLC
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
