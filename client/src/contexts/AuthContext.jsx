/**
 * AuthContext.jsx — Secure Auth Provider (Phase 91: Zero-Leak Auth)
 *
 * Login flow:
 *   1. User enters email + password
 *   2. AuthContext calls POST /api/auth/ceo-login (CEO) or POST /api/v1/auth/sp-login (SP)
 *   3. Backend validates credentials and returns a signed session JWT (8-hour TTL)
 *   4. JWT is stored in React state (memory-only) + module-level auth-store
 *   5. All API client libraries read the JWT via getAuthToken()
 *   6. On logout or 401, token is cleared — user must re-authenticate
 *
 * SECURITY: No API keys, passwords, or credentials in the frontend bundle.
 * The session JWT is the only auth artifact — signed server-side, time-limited.
 */

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { setAuthToken, clearAuthToken } from "../lib/auth-store";

/** Decode JWT payload without verification (client-side role extraction only). */
function decodeJWTPayload(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://moltbot-triage-engine.jamarr.workers.dev";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

/**
 * useAuth() — Hook for consuming auth state in any component.
 *
 * Returns:
 *   - isAuthenticated: boolean
 *   - token: string | null (Session JWT, only set when authenticated)
 *   - spProfile: { name, role, tier, email } | null
 *   - login(email, password): { success, error? }
 *   - logout(): void — clears token, forces re-auth
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [spProfile, setSpProfile] = useState(null);

  const isAuthenticated = token !== null;

  const login = useCallback(async (email, password) => {
    const trimmed = (email || "").trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return { success: false, error: "Invalid email." };
    if (!password) return { success: false, error: "Password required." };

    // Try CEO login first
    try {
      const ceoRes = await fetch(`${API_BASE}/api/auth/ceo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      });

      if (ceoRes.ok) {
        const data = await ceoRes.json();
        if (data.token) {
          setAuthToken(data.token);
          setToken(data.token);
          const claims = decodeJWTPayload(data.token);
          setSpProfile({ name: "Jamarr Mayes", role: claims?.role || "CEO", tier: "executive", email: trimmed });
          return { success: true };
        }
      }

      // If CEO login returned 401, try SP login
      if (ceoRes.status === 401) {
        const spRes = await fetch(`${API_BASE}/api/v1/auth/sp-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, password }),
        });
        const spData = await spRes.json();
        if (spRes.ok && spData.success) {
          const jwt = spData.token || null;
          if (jwt) {
            setAuthToken(jwt);
            setToken(jwt);
          }
          const spClaims = jwt ? decodeJWTPayload(jwt) : null;
          setSpProfile({
            name: spData.fullName || "Sovereign Professional",
            role: spClaims?.role || "SP",
            tier: "standard",
            email: trimmed,
          });
          return { success: true };
        }
        return { success: false, error: spData.error || "Invalid credentials." };
      }

      // Other error (503, 500, etc.)
      const errData = await ceoRes.json().catch(() => ({}));
      return { success: false, error: errData.error || "Login failed." };
    } catch {
      return { success: false, error: "Unable to connect to authentication service." };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setToken(null);
    setSpProfile(null);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, token, spProfile, login, logout }),
    [isAuthenticated, token, spProfile, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
