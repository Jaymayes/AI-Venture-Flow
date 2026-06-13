import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { setAuthToken } from "../lib/auth-store";

// ---------------------------------------------------------------------------
// CEO Authentication Gate — PASSWORDLESS (ARCHITECTURE.md Pillar 1)
// ---------------------------------------------------------------------------
// Magic-link auth for CEO-protected pages (/ceo, /triage, etc.). The operator
// requests a single-use link via POST /api/v1/auth/magic/request. The link is
// short-lived (10 min), hash-only stored server-side, and contextually bound to
// the requesting IP + User-Agent (verified at /api/v1/auth/magic/verify, which
// fails secure on mismatch to block link forwarding).
//
// NO PASSWORD is ever collected or transmitted — passwords do not exist in
// Sovereign OS. A valid session JWT (minted by the verify landing page) is stored
// in sessionStorage + the module-level auth-store for API client libraries.
// ---------------------------------------------------------------------------

const AUTH_KEY = "rsllc_ceo_jwt";
const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

/**
 * Decode JWT payload without verification (client-side exp check only).
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
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check sessionStorage for a valid (non-expired) JWT on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_KEY);
    if (stored) {
      const payload = decodeJWTPayload(stored);
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        setAuthToken(stored);
        setAuthenticated(true);
      } else {
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

    setLoading(true);
    setError(null);

    // Request a passwordless magic link. The endpoint is intentionally NEUTRAL
    // (no account enumeration) — same response whether or not the address maps to
    // a user — so we show the same confirmation regardless of outcome.
    try {
      await fetch(`${API_BASE}/api/v1/auth/magic/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
    } catch {
      setError("Unable to reach the auth service. Please try again in a moment.");
      setLoading(false);
      return;
    }
    setLoading(false);
    setSent(true);
  };

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
          Referral Service LLC — CEO Portal · Passwordless
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

        {sent ? (
          /* Stateful "check your inbox" landing (Pillar 1 — stateful landing page) */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-center"
          >
            <Mail size={28} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-semibold text-sm mb-1">Check your inbox</p>
            <p className="text-white/50 text-xs leading-relaxed">
              If an account exists for{" "}
              <span className="text-white/70">{email.trim().toLowerCase()}</span>, a single-use
              magic link — bound to your current IP &amp; device and valid for 10 minutes — has
              been dispatched. Awaiting contextual IP/UA validation on click.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-4 text-cyan-400/70 text-xs hover:text-cyan-400 transition-colors"
            >
              Use a different email
            </button>
          </motion.div>
        ) : (
          /* Login form — EMAIL ONLY, no password field */
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
              {loading ? "Requesting…" : "Request Secure Magic Link"}
            </button>

            {/* DEV-ONLY preview bypass. import.meta.env.DEV is FALSE in every
                production build (`npm run build` / `vite build`), so this whole
                block is dead-code-eliminated from the deployed bundle and can
                NEVER act as an auth bypass in production. Local `npm run dev` only.
                Renders the gated page in-place so we can see UI work mid-wiring. */}
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => setAuthenticated(true)}
                className="block w-full text-center text-amber-400/70 text-[11px] hover:text-amber-400 transition-colors"
                title="Dev-only: renders the gated page locally. Stripped from production builds."
              >
                Bypass (Dev Mode) — local preview only
              </button>
            )}
          </form>
        )}

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
