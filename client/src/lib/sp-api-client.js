/**
 * sp-api-client.js — Authenticated API Client for SP Launchpad Dashboard
 *
 * Purpose-built fetch wrapper targeting the moltbot-triage-engine Worker.
 * Reads the Bearer token from AuthContext (passed by caller) so the token
 * never touches localStorage or sessionStorage.
 *
 * Features:
 *   - CORS mode: "cors" with JSON content type
 *   - Authorization: Bearer {token} injected from AuthContext
 *   - X-Caller-Role: SOVEREIGN_PROFESSIONAL header on every request
 *   - Graceful 401/403 handling — returns { unauthorized: true } so the
 *     consuming component can call logout() and redirect to the auth gate
 *   - Network error isolation — throws descriptive errors
 *   - Non-JSON response detection (Cloudflare Access HTML pages)
 */

const BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

// ---------------------------------------------------------------------------
// Core Fetch
// ---------------------------------------------------------------------------

/**
 * Authenticated fetch against the Triage Engine Worker.
 *
 * @param {string} token - Bearer token from useAuth()
 * @param {"GET"|"POST"|"PUT"|"DELETE"} method
 * @param {string} path - API path (e.g., "/api/triage/handoffs")
 * @param {object|null} body - JSON body for POST/PUT
 * @param {object} extraHeaders - Additional headers
 * @returns {Promise<object>} Parsed JSON response
 * @throws {Error} Network or HTTP errors
 */
async function spFetch(token, method, path, body = null, extraHeaders = {}) {
  const opts = {
    method,
    mode: "cors",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Caller-Role": "SOVEREIGN_PROFESSIONAL",
      ...extraHeaders,
    },
  };

  if (body && (method === "POST" || method === "PUT")) {
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  // ── 401 / 403 — return sentinel so component can trigger logout ──
  if (res.status === 401 || res.status === 403) {
    return {
      unauthorized: true,
      status: res.status,
      message: res.status === 401
        ? "Session expired — please re-authenticate."
        : "Insufficient permissions for this resource.",
    };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }

  // Guard against non-JSON responses (Cloudflare Access HTML gates, etc.)
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `API Route Offline — expected JSON but received ${contentType || "unknown content-type"} from ${path}`
    );
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// SP Dashboard Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch high-intent handoff queue (intent >= 85) for the escalation inbox.
 * Returns handoff summaries sorted by intent score descending.
 */
export function fetchEscalations(token, cursor) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return spFetch(token, "GET", `/api/triage/handoffs${qs}`);
}

/**
 * Fetch the GLM-5 Full Context Briefing for a specific high-intent prospect.
 * Returns firmographic analysis, sentiment, pain points, strategic directives.
 */
export function fetchBriefing(token, engagementId) {
  return spFetch(token, "GET", `/api/triage/briefing/${encodeURIComponent(engagementId)}`);
}

/**
 * Claim a high-intent lead — activates human takeover, mutes AI outreach.
 */
export function claimEscalation(token, engagementId, notes) {
  return spFetch(token, "POST", `/api/triage/takeover/${encodeURIComponent(engagementId)}`, {
    operatorId: "sp-launchpad",
    notes: notes || "Claimed from SP Launchpad",
  });
}

/**
 * Fetch pipeline analytics — God View telemetry for PodMetrics.
 * Returns total leads, active outreach count, pipeline value, CPL, model usage.
 */
export function fetchAnalytics(token) {
  return spFetch(token, "GET", "/api/triage/analytics");
}

/**
 * Fetch SP ledger — partner records with tier, commission, pipeline stats.
 */
export function fetchSPLedger(token) {
  return spFetch(token, "GET", "/api/sp/ledger");
}

/**
 * Fetch disbursement ledger — commission payouts, gross margins, approval status.
 */
export function fetchDisbursements(token) {
  return spFetch(token, "GET", "/api/finops/disbursements");
}

/**
 * Fetch CRM metrics — total leads, high intent count, avg score, takeovers.
 */
export function fetchCrmMetrics(token) {
  return spFetch(token, "GET", "/api/crm/metrics", null, {
    "X-Caller-Email": import.meta.env.VITE_CALLER_EMAIL || "",
  });
}

/**
 * Fetch full engagement detail for a single prospect (CRM + handoff payload).
 */
export function fetchEngagementDetail(token, engagementId) {
  return spFetch(token, "GET", `/api/triage/engagement/${encodeURIComponent(engagementId)}`);
}
