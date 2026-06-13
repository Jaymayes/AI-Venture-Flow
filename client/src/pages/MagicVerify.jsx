import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Shield, Loader2, AlertTriangle } from "lucide-react";
import { setAuthToken } from "../lib/auth-store";

// ---------------------------------------------------------------------------
// MagicVerify — completes the passwordless magic-link loop (Pillar 1).
// ---------------------------------------------------------------------------
// The emailed link points at /portal/magic?token=<raw>. This page reads that
// token, POSTs it to /api/v1/auth/magic/verify (atomic single-use consume +
// contextual IP/UA check server-side), stores the returned session JWT exactly
// like AuthGate does (sessionStorage key "rsllc_ceo_jwt" + module auth-store),
// then redirects into /ceo. Failure → clear message + path back to request a new
// link. MUST be registered BEFORE /portal/:id so it isn't shadowed by ClientPortal.
// ---------------------------------------------------------------------------

const AUTH_KEY = "rsllc_ceo_jwt";
const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

export default function MagicVerify() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState("verifying"); // verifying | error
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setErrMsg("This link is missing its token. Request a new sign-in link.");
      setStatus("error");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/magic/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.token) {
          setAuthToken(data.token);
          sessionStorage.setItem(AUTH_KEY, data.token);
          // Clear the token from the URL bar, then enter the portal.
          window.history.replaceState({}, "", "/portal/magic");
          setLocation("/ceo");
        } else {
          setErrMsg(data.error || "This link is invalid or has expired (links last 10 minutes, single use).");
          setStatus("error");
        }
      } catch {
        if (cancelled) return;
        setErrMsg("Unable to reach the authentication service. Please try again in a moment.");
        setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [setLocation]);

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
        className="relative z-10 glass noise rounded-2xl p-8 w-full max-w-md border border-white/10 text-center"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Shield size={32} className="text-cyan-400" />
          </div>
        </div>

        {status === "verifying" ? (
          <>
            <Loader2 size={22} className="text-cyan-400 mx-auto mb-3 animate-spin" />
            <h1 className="text-xl font-bold gradient-text mb-1">Verifying your secure link…</h1>
            <p className="text-white/40 text-sm">Validating your single-use sign-in token.</p>
          </>
        ) : (
          <>
            <AlertTriangle size={26} className="text-amber-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white mb-2">Sign-in link not valid</h1>
            <p className="text-white/50 text-sm leading-relaxed mb-5">{errMsg}</p>
            <button
              type="button"
              onClick={() => setLocation("/ceo")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Request a new magic link
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
