import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, BookOpen, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

// ---------------------------------------------------------------------------
// Sovereign Professional Authentication Gate
// ---------------------------------------------------------------------------
// Client-side auth gate for SP-facing pages (e.g. /playbook).
// Stores auth state in sessionStorage so the SP stays authenticated
// for the duration of the browser session without re-entering credentials.
//
// Separate from CEO AuthGate — different PIN and storage key.
// ---------------------------------------------------------------------------

const AUTH_KEY = "rsllc_sp_auth";
const SP_PIN = "PLAYBOOK2026";

export default function SPGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_KEY);
    if (stored === "true") {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.trim() === SP_PIN) {
      sessionStorage.setItem(AUTH_KEY, "true");
      setAuthenticated(true);
      setError(null);
    } else {
      setError("Invalid access code. Contact your team lead for credentials.");
      setPin("");
    }
  };

  // Don't flash the gate while checking sessionStorage
  if (checking) return null;

  if (authenticated) return children;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-amber-500/15 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 glass noise rounded-2xl p-8 w-full max-w-md border border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-400/20 flex items-center justify-center">
            <BookOpen size={32} className="text-amber-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center gradient-text mb-1">
          Sovereign Professional Access
        </h1>
        <p className="text-white/40 text-sm text-center mb-8">
          Referral Service LLC &mdash; SP Training Portal
        </p>

        {/* PIN form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white/50 mb-2">
              Access Code
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Lock size={16} className="text-white/30" />
              </div>
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="Enter SP access code"
                autoFocus
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Authenticate
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
