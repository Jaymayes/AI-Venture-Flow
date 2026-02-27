/**
 * AuthContext.jsx — Secure Auth Provider for Sovereign Professional Dashboard
 *
 * Stores the Bearer token in React state (memory-only). When the browser tab
 * closes, the token is gone — no localStorage, no sessionStorage exposure.
 *
 * Login flow:
 *   1. SP enters their access code (PIN)
 *   2. AuthContext validates against the SP_PIN constant
 *   3. On success, the Bearer token (from VITE_ADMIN_API_KEY) is loaded
 *      into React state — available to all child components via useAuth()
 *   4. On 401/403 from any API call, consumers call logout() to force re-auth
 *
 * This is NOT the security boundary — the real enforcement lives server-side
 * (Cloudflare Access JWT + CEO_ADMIN_KEY on the Worker). This context
 * prevents casual unauthorized frontend access and centralizes token management.
 */

import { createContext, useContext, useState, useCallback, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SP_PIN = "PLAYBOOK2026";
const API_TOKEN = import.meta.env.VITE_ADMIN_API_KEY || "";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

/**
 * useAuth() — Hook for consuming auth state in any component.
 *
 * Returns:
 *   - isAuthenticated: boolean
 *   - token: string | null (Bearer token, only set when authenticated)
 *   - spProfile: { name, role, tier } | null
 *   - login(pin): boolean — returns true on success
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

  const login = useCallback((pin) => {
    if (pin.trim() === SP_PIN) {
      // Store token in React state — memory only, never persisted
      setToken(API_TOKEN);
      setSpProfile({
        name: "Sovereign Professional",
        role: "SOVEREIGN_PROFESSIONAL",
        tier: "standard",
      });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setSpProfile(null);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, token, spProfile, login, logout }),
    [isAuthenticated, token, spProfile, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
