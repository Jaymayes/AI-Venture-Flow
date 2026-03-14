/**
 * partner-client.js — API client for Partner Portal (Phase 22)
 *
 * Wraps the Partner Portal endpoints deployed to the Cloudflare Worker:
 *   GET  /api/partner/leads           — List partner's assigned leads
 *   GET  /api/partner/leads/:id       — Full lead detail with briefing
 *   POST /api/partner/leads/:id/stage — Update lead sales stage
 *
 * Authorization: Bearer token + X-Partner-Email header.
 */

import { getAuthToken } from './auth-store';

const BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

async function partnerFetch(method, path, body, partnerEmail) {
  const token = getAuthToken() || sessionStorage.getItem("rsllc_sp_token") || "";
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Partner-Email": partnerEmail,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  if (res.status === 401) {
    sessionStorage.removeItem("rsllc_ceo_jwt");
    sessionStorage.removeItem("rsllc_sp_token");
    window.location.reload();
    throw new Error("Session expired — re-authenticating");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `API Route Offline — expected JSON but received ${contentType || "unknown content-type"} from ${path}`
    );
  }

  return res.json();
}

/** Fetch all leads assigned to the authenticated partner. */
export function fetchPartnerLeads(partnerEmail) {
  return partnerFetch("GET", "/api/partner/leads", null, partnerEmail);
}

/** Get full lead detail including context briefing and audit trail. */
export function fetchPartnerLeadDetail(leadId, partnerEmail) {
  return partnerFetch("GET", `/api/partner/leads/${leadId}`, null, partnerEmail);
}

/** Update a lead's sales stage (e.g., consultation_scheduled, proposal_sent, closed_won). */
export function updateLeadStage(leadId, stage, notes, partnerEmail) {
  return partnerFetch(
    "POST",
    `/api/partner/leads/${leadId}/stage`,
    { stage, ...(notes ? { notes } : {}) },
    partnerEmail
  );
}

/** Generate a deal room magic link for a lead (Phase 24). */
export function generateDealRoom(leadId, partnerEmail) {
  return partnerFetch(
    "POST",
    `/api/partner/leads/${leadId}/deal-room`,
    {},
    partnerEmail
  );
}
