import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { setAuthToken } from "../lib/auth-store";

// ---------------------------------------------------------------------------
// CEO Authentication Gate (Phase 91: Zero-Leak Auth)
// ---------------------------------------------------------------------------
// Email + password auth gate for CEO-protected pages (/ceo, /triage, etc.).
// Validates credentials via POST /api/auth/ceo-login (server-side).
// Stores the session JWT in sessionStorage for cross-refresh persistence
// and in the module-level auth-store for API client libraries.
//
// SECURITY: No hardcoded credentials. All validation is server-side.
// The JWT is signed, time-limited (8h), and cryptographically verified.
// ---------------------------------------------------------------------------

const AUTH_KEY = "rsllc_ceo_jwt";
const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

/**
 * Decode JWT payload without verification (for client-side exp check only).
 * Actual signature verification happens server-side on every API call.
 */
function decodeJWTPayload(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

export default function AuthGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check sessionStorage for a valid (non-expired) JWT on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_KEY);
    if (stored) {
      const payload = decodeJWTPayload(stored);
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        // JWT is still valid — restore session
        setAuthToken(stored);
        setAuthenticated(true);
      } else {
        // JWT expired — clear it
        sessionStorage.removeItem(AUTH_KEY);
      }
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/ceo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // Store JWT in memory + sessionStorage
        setAuthToken(data.token);
        sessionStorage.setItem(AUTH_KEY, data.token);
        setAuthenticated(true);
        setError(null);
      } else {
        setError(data.error || "Invalid credentials.");
        setPassword("");
      }
    } catch {
      setError("Unable to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  // Don't flash the gate while checking sessionStorage
  if (checking) return null;

  if (authenticated) return children;

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
            <Shield size={32} className="text-cyan-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center gradient-text mb-1">
          Executive Access
        </h1>
        <p className="text-white/40 text-sm text-center mb-8">
          Referral Service LLC — CEO Portal
        </p>

        {/* Identity badge */}
        <div className="glass noise rounded-xl p-4 mb-6 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center text-white font-bold text-sm">
              JM
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Jamarr Mayes</p>
              <p className="text-white/30 text-xs">Chief Executive Officer</p>
            </div>
          </div>
        </div>

        {/* Login form */}
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
                placeholder="you@referralsvc.com"
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
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

          {/* Error */}
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
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
