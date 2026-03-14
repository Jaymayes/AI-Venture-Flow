/**
 * auth-store.js — Module-level in-memory token store (Phase 91: Zero-Leak Auth)
 *
 * Replaces static API key exposure. The session JWT is:
 *   - Set by AuthContext/AuthGate after successful login
 *   - Read by all API client libraries for Authorization headers
 *   - Never persisted in localStorage (XSS-resistant)
 *   - Cleared on tab close (memory-only)
 *
 * SessionStorage is used ONLY for session persistence across page refreshes.
 * The JWT itself is short-lived (8 hours) and cryptographically signed.
 */

let _token = null;

/** Set the session JWT (called after login) */
export const setAuthToken = (t) => { _token = t; };

/** Get the current session JWT (called by API client libraries) */
export const getAuthToken = () => _token;

/** Clear the session JWT (called on logout) */
export const clearAuthToken = () => { _token = null; };
