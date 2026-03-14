/**
 * sp-client.js — API client for SP Command Center
 *
 * Handles engine config CRUD and overview data fetching.
 * Auth: x-partner-email header on all calls.
 */

const BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

async function spFetch(method, path, body, spEmail) {
  // SP token for partner pages; fall back to CEO JWT for admin pages
  const token = sessionStorage.getItem("rsllc_sp_token")
    || sessionStorage.getItem("rsllc_ceo_jwt");
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-partner-email": spEmail,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (res.status === 401) {
    // JWT signature mismatch or expired — clear stale session and force re-login
    sessionStorage.removeItem("rsllc_ceo_jwt");
    sessionStorage.removeItem("rsllc_sp_token");
    window.location.reload();
    throw new Error("Session expired — re-authenticating");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

/** Fetch the SP's engine config + engagement stats */
export function fetchEngineConfig(spEmail) {
  return spFetch("GET", "/api/v1/sp/engine-config", null, spEmail);
}

/** Save/upsert the SP's engine config */
export function saveEngineConfig(config, spEmail) {
  return spFetch("POST", "/api/v1/sp/engine-config", config, spEmail);
}

/** Fetch the fleet dashboard data (overview stats + earnings + leads) */
export function fetchOverviewData(slug, spEmail) {
  return spFetch("GET", `/api/v1/partners/${slug}/dashboard`, null, spEmail);
}

/** Fetch SP compliance status (W-9, 1099, expenses) */
export function fetchComplianceStatus(spEmail) {
  return spFetch("GET", "/api/v1/compliance/status", null, spEmail);
}

/** Initiate DocuSign W-9 signing ceremony — returns { signingUrl } */
export function initiateW9Signing(spEmail) {
  return spFetch("POST", "/api/v1/compliance/w9/sign", {}, spEmail);
}

/** Fetch SOWs for the authenticated SP (CEO sees all) */
export function fetchSOWs(spEmail) {
  return spFetch("GET", "/api/v1/sows", null, spEmail);
}

/** Mark a SOW milestone as completed */
export function markSOWComplete(sowId, spEmail) {
  return spFetch("POST", `/api/v1/sows/${sowId}/complete`, {}, spEmail);
}

/** CEO-only: Dispatch a new SOW to an SP */
export function createSOW(sowData, spEmail) {
  return spFetch("POST", "/api/v1/admin/sows", sowData, spEmail);
}

// ── Phase 75: Team / Right to Substitute ──

/** Fetch team members for the authenticated SP (CEO sees all) */
export function fetchTeamMembers(spEmail) {
  return spFetch("GET", "/api/v1/team", null, spEmail);
}

/** Invite a new team member */
export function inviteTeamMember(data, spEmail) {
  return spFetch("POST", "/api/v1/team/invite", data, spEmail);
}

/** Revoke a team member */
export function revokeTeamMember(memberId, spEmail) {
  return spFetch("DELETE", `/api/v1/team/${memberId}`, null, spEmail);
}

// ── Phase 76: Expense Tracker / Economic Reality ──

/** Fetch expenses for the authenticated SP (CEO sees all) */
export function fetchExpenses(spEmail) {
  return spFetch("GET", "/api/v1/expenses", null, spEmail);
}

/** Log a new expense */
export function createExpense(data, spEmail) {
  return spFetch("POST", "/api/v1/expenses", data, spEmail);
}

// ── Phase 81: Dual-Valve Command Console ──

/** Fetch both valve states: { sp_recruitment: 'ON'|'OFF', client_lead: 'ON'|'OFF' } */
export function fetchValveStatus(spEmail) {
  return spFetch("GET", "/api/v1/admin/reservoir/status", null, spEmail);
}

/** Toggle a specific valve. target: 'sp_recruitment' | 'client_lead', status: 'ON' | 'OFF' */
export function toggleValve(spEmail, target, status) {
  return spFetch("POST", "/api/v1/admin/reservoir/toggle", { target, status }, spEmail);
}

// ── Phase 82: SP-scoped Client Lead Engine (no admin privileges) ──

/** Fetch SP's own client lead engine status */
export function fetchSPEngineStatus(spEmail) {
  return spFetch("GET", "/api/v1/sp/engine/status", null, spEmail);
}

/** Toggle SP's own client lead engine ON/OFF (scoped to their partner_id only) */
export function toggleSPEngine(spEmail, active) {
  return spFetch("POST", "/api/v1/sp/engine/toggle", { active }, spEmail);
}

// ── Phase 78: Dual-Ingestion Engine ──

/** Upload parsed CSV leads into Enterprise Reservoir (Phase 79) */
export function ingestCSV(leads, spEmail, bucket = "sp_recruitment", assignedSpId = null) {
  return spFetch("POST", "/api/v1/admin/upload-leads", {
    leads,
    bucket,
    assigned_sp_id: assignedSpId,
  }, spEmail);
}

/** Step 18.3: Chunked batch ingestion — sends ~500 rows at a time for AI qualification */
export function ingestBatch(leads, spEmail) {
  return spFetch("POST", "/api/v1/admin/ingest-batch", { leads }, spEmail);
}

/** Phase 84: Fetch reservoir activity telemetry (status counts + recent leads) */
export function fetchReservoirActivity(spEmail) {
  return spFetch("GET", "/api/v1/admin/reservoir/activity", null, spEmail);
}

/** Re-enqueue pending leads into the AI qualification pipeline */
export function reenqueuePending(spEmail) {
  return spFetch("POST", "/api/v1/admin/reenqueue-pending", null, spEmail);
}

/** Epic 22: Manually trigger the Deliverability Drip Engine */
export function dispatchDrip(spEmail) {
  return spFetch("POST", "/api/v1/admin/dispatch-drip", null, spEmail);
}

// ── Epic 28: Deal Room Modal ──

/** Fetch full deal profile for a lead (lead + deal room + deal + notes) */
export function fetchDeal(leadId, spEmail) {
  return spFetch("GET", `/api/v1/admin/deal/${leadId}`, null, spEmail);
}

/** Update lead status and/or deal stage */
export function patchDeal(leadId, updates, spEmail) {
  return spFetch("PATCH", `/api/v1/admin/deal/${leadId}`, updates, spEmail);
}

/** Add a CEO note to a deal */
export function addDealNote(leadId, note, spEmail) {
  return spFetch("POST", `/api/v1/admin/deal/${leadId}/notes`, { note }, spEmail);
}

// ── Epic 30: Inbox Fleet Manager ──

/** Add a new sender inbox to the fleet */
export function addSenderInbox(email, targetLimit, spEmail) {
  return spFetch("POST", "/api/v1/admin/inboxes", { email, target_limit: targetLimit }, spEmail);
}

// ── Epic 32: SP Portal — IDOR-scoped endpoints ──

/** Fetch leads assigned to the authenticated SP */
export function fetchMyLeads(spEmail) {
  return spFetch("GET", "/api/sp/my-leads", null, spEmail);
}

/** Fetch full deal profile (SP ownership-verified) */
export function fetchSpDeal(leadId, spEmail) {
  return spFetch("GET", `/api/sp/deal/${leadId}`, null, spEmail);
}

/** Update deal status/stage/tcv (SP ownership-verified) */
export function patchSpDeal(leadId, updates, spEmail) {
  return spFetch("PATCH", `/api/sp/deal/${leadId}`, updates, spEmail);
}

/** Add note to deal (SP ownership-verified) */
export function addSpDealNote(leadId, note, spEmail) {
  return spFetch("POST", `/api/sp/deal/${leadId}/notes`, { note }, spEmail);
}
