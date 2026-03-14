/**
 * api.js — Authenticated API client for the Triage Engine backend.
 *
 * Routes all requests through the Workers backend with proper Bearer auth.
 * Prevents the "<!doctype" HTML-instead-of-JSON error by ensuring:
 *   1. BASE URL always points to the Workers backend (not the frontend host)
 *   2. Authorization header is injected on every request
 */
import { getAuthToken } from './auth-store';

const BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

export async function apiFetch(method, path, body) {
  const token = getAuthToken();
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }

  // Guard against non-JSON responses (HTML error pages, Cloudflare Access gates)
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `API Route Offline — expected JSON but received ${contentType || "unknown content-type"} from ${path}`
    );
  }

  return res.json();
}
