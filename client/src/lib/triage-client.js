/**
 * triage-client.js — Secure API client for Triage Endpoints.
 *
 * Wraps triage, campaign, and SP endpoints deployed to the Cloudflare Worker:
 *   GET  /api/triage/handoffs
 *   GET  /api/triage/engagement/{id}
 *   POST /api/triage/takeover/{id}
 *   POST /api/triage/release/{id}
 *   POST /api/triage/dispatch/{id}    (Phase 5: Human Composer)
 *   POST /api/campaign/ingest         (Phase 7: Campaign Studio)
 *   GET  /api/triage/analytics        (Phase 7: God View)
 *   POST /api/sp/onboard              (Phase 14: SP Onboarding)
 *   GET  /api/sp/ledger               (Phase 14: SP Ledger)
 *   GET  /api/finops/disbursements    (Phase 15: Disbursement Ledger)
 *   POST /api/finops/approve          (Phase 15: Margin Guard Approval)
 *   GET  /api/secops/ledger           (Phase 16: SecOps Telemetry)
 *   GET  /api/salvage/kanban          (Phase 17: Revenue Salvage Kanban)
 *   POST /api/salvage/execute         (Phase 17: Hostile Takeover)
 *   POST /api/salvage/seed            (Phase 17: Seed Demo Data)
 *   POST /api/delegation/invite       (Phase 7: Create Sub-Contractor Invite)
 *   GET  /api/delegation/invites      (Phase 7: List SP Invites)
 *   POST /api/delegation/revoke       (Phase 7: Revoke Invite)
 *   POST /api/delegation/activate     (Phase 7: Activate Invite)
 *   GET  /api/delegation/team         (Phase 7: List Sub-Contractors)
 *   GET  /api/delegation/metrics      (Phase 7: Sub-Contractor FinOps)
 *   GET  /api/delegation/me           (Phase 7: Sub-Contractor Profile)
 *
 * Authorization: Bearer token injected from VITE_ADMIN_API_KEY.
 * Delegation endpoints also send X-Caller-Email (from VITE_CALLER_EMAIL).
 */

const BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY || "";
const CALLER_EMAIL = import.meta.env.VITE_CALLER_EMAIL || "";

async function triageFetch(method, path, body, extraHeaders) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(extraHeaders || {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }

  return res.json();
}

/** Build delegation headers — injects X-Caller-Email and X-Caller-Role. */
function delegationHeaders(role = "SOVEREIGN_PROFESSIONAL") {
  const headers = {};
  if (CALLER_EMAIL) headers["X-Caller-Email"] = CALLER_EMAIL;
  headers["X-Caller-Role"] = role;
  return headers;
}

/** List all handoff summaries (triage queue). */
export function fetchHandoffs(cursor) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return triageFetch("GET", `/api/triage/handoffs${qs}`);
}

/** Get full engagement state + handoff payload for a single prospect. */
export function fetchEngagement(id) {
  return triageFetch("GET", `/api/triage/engagement/${encodeURIComponent(id)}`);
}

/** Activate human takeover — mutes AI outreach for this engagement. */
export function initiateTakeover(id, { operatorId, notes } = {}) {
  return triageFetch("POST", `/api/triage/takeover/${encodeURIComponent(id)}`, {
    operatorId: operatorId || "ceo-dashboard",
    notes,
  });
}

/** Release human takeover — re-enables AI outreach. */
export function releaseTakeover(id, { reason } = {}) {
  return triageFetch("POST", `/api/triage/release/${encodeURIComponent(id)}`, {
    reason,
  });
}

/** Dispatch a human-authored message via Email or SMS (Phase 5: Human Composer). */
export function dispatchMessage(id, { channel, message, subject } = {}) {
  return triageFetch("POST", `/api/triage/dispatch/${encodeURIComponent(id)}`, {
    channel,
    message,
    subject,
  });
}

/** Ingest a batch of campaign prospects (max 200 per request). Phase 7: Campaign Studio. */
export function ingestCampaign(prospects, campaignId) {
  return triageFetch("POST", "/api/campaign/ingest", {
    prospects,
    ...(campaignId ? { campaignId } : {}),
  });
}

/** Fetch pipeline analytics — God View telemetry. Phase 7: FinOps ROI. */
export function getAnalytics() {
  return triageFetch("GET", "/api/triage/analytics");
}

/** Deploy SP Onboarding — creates a new Sovereign Professional. Phase 14. */
export function deploySPOnboarding(payload) {
  return triageFetch("POST", "/api/sp/onboard", payload);
}

/** Fetch SP Ledger — returns pipeline stats + all SP records. Phase 14. */
export function fetchSPLedger() {
  return triageFetch("GET", "/api/sp/ledger");
}

/** Fetch Disbursement Ledger — returns summary stats + all payout records. Phase 15. */
export function fetchDisbursements() {
  return triageFetch("GET", "/api/finops/disbursements");
}

/** CEO Approve a payout — enforces 80% margin gate server-side. Phase 15. */
export function approveDisbursement(id) {
  return triageFetch("POST", "/api/finops/approve", { id });
}

/** Fetch SecOps Ledger — returns stats + security intercept records. Phase 16. */
export function fetchSecOpsLedger() {
  return triageFetch("GET", "/api/secops/ledger");
}

/** Fetch Salvage Kanban — 21-day burn-down board with all active deals. Phase 17. */
export function fetchSalvageKanban() {
  return triageFetch("GET", "/api/salvage/kanban");
}

/** Execute Hostile Takeover — revoke SP access, demote commission. Phase 17. */
export function executeSalvageTakeover(id) {
  return triageFetch("POST", "/api/salvage/execute", { id });
}

/** Seed demo salvage deals for the Kanban board. Phase 17. */
export function seedSalvageData() {
  return triageFetch("POST", "/api/salvage/seed");
}

/** Fetch compliance summary (OpenClaw posture). Phase 18. */
export function fetchComplianceSummary() {
  return triageFetch("GET", "/api/compliance/summary");
}

/** Fetch compliance events (optionally filtered). Phase 18. */
export function fetchComplianceEvents(vector, violationsOnly, limit) {
  const params = new URLSearchParams();
  if (vector) params.set("vector", vector);
  if (violationsOnly) params.set("violations", "true");
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return triageFetch("GET", `/api/compliance/events${qs ? `?${qs}` : ""}`);
}

/** Mark a compliance event as reviewed by CEO. Phase 18. */
export function reviewComplianceEvent(eventId) {
  return triageFetch("POST", "/api/compliance/review", { eventId });
}

/** Recompute compliance summary from event index. Phase 18. */
export function refreshComplianceSummary() {
  return triageFetch("POST", "/api/compliance/refresh");
}

// ---------------------------------------------------------------------------
// Phase 7: Delegation API — Sub-Contractor Management
// ---------------------------------------------------------------------------

/** Create a scoped, time-bound invite for a sub-contractor. */
export function createDelegationInvite(payload) {
  return triageFetch("POST", "/api/delegation/invite", payload, delegationHeaders());
}

/** List all invites created by the calling SP. */
export function fetchDelegationInvites() {
  return triageFetch("GET", "/api/delegation/invites", null, delegationHeaders());
}

/** Revoke an invite and suspend corresponding sub-contractor. */
export function revokeDelegationInvite(inviteId) {
  return triageFetch("POST", "/api/delegation/revoke", { inviteId }, delegationHeaders());
}

/** Activate a pending invite as a sub-contractor. */
export function activateDelegationInvite(inviteId, name, email) {
  return triageFetch("POST", "/api/delegation/activate", { inviteId, name, email }, delegationHeaders());
}

/** List all sub-contractors under the calling SP with token usage. */
export function fetchDelegationTeam() {
  return triageFetch("GET", "/api/delegation/team", null, delegationHeaders());
}

/** Get aggregated FinOps metrics for all sub-contractors. */
export function fetchDelegationMetrics() {
  return triageFetch("GET", "/api/delegation/metrics", null, delegationHeaders());
}

/** Sub-contractor views own profile and usage stats. */
export function fetchMyDelegationProfile() {
  return triageFetch("GET", "/api/delegation/me", null, delegationHeaders("SUB_CONTRACTOR"));
}

// ---------------------------------------------------------------------------
// Phase 12: CRM Portal — D1-backed pipeline
// ---------------------------------------------------------------------------

/** Fetch CRM leads from D1 (RBAC-filtered by caller email). */
export function fetchCrmLeads(limit = 50, offset = 0) {
  return triageFetch(
    "GET",
    `/api/crm/leads?limit=${limit}&offset=${offset}`,
    null,
    CALLER_EMAIL ? { "X-Caller-Email": CALLER_EMAIL } : {}
  );
}

/** Get full CRM lead detail by engagement ID, including context briefing + escalation audit. */
export function fetchCrmLead(engagementId) {
  return triageFetch(
    "GET",
    `/api/crm/leads/${encodeURIComponent(engagementId)}`,
    null,
    CALLER_EMAIL ? { "X-Caller-Email": CALLER_EMAIL } : {}
  );
}

/** Get aggregated KPI metrics (total leads, high intent, avg score, takeovers). */
export function fetchCrmMetrics() {
  return triageFetch(
    "GET",
    "/api/crm/metrics",
    null,
    CALLER_EMAIL ? { "X-Caller-Email": CALLER_EMAIL } : {}
  );
}

/** Mark a CRM lead as human-taken-over. */
export function crmTakeover(engagementId) {
  return triageFetch(
    "POST",
    `/api/crm/leads/${encodeURIComponent(engagementId)}/takeover`,
    null,
    CALLER_EMAIL ? { "X-Caller-Email": CALLER_EMAIL } : {}
  );
}

/** Release a CRM lead back to AI pipeline. */
export function crmRelease(engagementId) {
  return triageFetch(
    "POST",
    `/api/crm/leads/${encodeURIComponent(engagementId)}/release`,
    null,
    CALLER_EMAIL ? { "X-Caller-Email": CALLER_EMAIL } : {}
  );
}

// ---------------------------------------------------------------------------
// HITL Draft Review — D1-backed pending_approval pipeline
// ---------------------------------------------------------------------------

/** Fetch HITL drafts from D1 (optionally filtered by status). */
export function fetchDrafts(status, limit = 50, offset = 0) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  return triageFetch("GET", `/api/drafts?${params.toString()}`);
}

/** Approve a HITL draft by ID — triggers Resend dispatch. */
export function approveDraft(draftId) {
  return triageFetch("POST", `/api/drafts/${draftId}/approve`);
}

// ---------------------------------------------------------------------------
// Phase 13: Top-of-Funnel Inbound Lead Capture
// ---------------------------------------------------------------------------

/** Submit a top-of-funnel lead to the moltbot-triage-engine. Phase 13. */
export function submitInboundLead(payload) {
  return triageFetch("POST", "/api/inbound/lead", payload);
}

// ---------------------------------------------------------------------------
// Sovereign Partner Onboarding — DocuSign SOW + D1 RBAC
// ---------------------------------------------------------------------------

/** Submit Sovereign Professional onboarding — dispatches DocuSign SOW + provisions D1 RBAC. */
export function submitPartnerOnboard(payload) {
  return triageFetch("POST", "/api/partners/onboard", payload);
}

// ---------------------------------------------------------------------------
// Outbound Campaign Launcher — LinkedIn Enrichment via Apollo.io Scraper
// ---------------------------------------------------------------------------

/** Launch outbound enrichment for LinkedIn profiles (admin only, max 20). */
export function launchOutboundCampaign(profiles) {
  return triageFetch(
    "POST",
    "/api/crm/outbound/launch",
    { profiles },
    CALLER_EMAIL ? { "X-Caller-Email": CALLER_EMAIL } : {}
  );
}
