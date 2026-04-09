/**
 * seo-client.js — Authenticated API client for the SEO Content Agent.
 *
 * Wraps all svcworker-seo-agent endpoints with Bearer auth:
 *   GET  /health                    — Service health & binding status
 *   POST /seo/run                   — Trigger Authority Loop execution
 *   POST /seo/resume                — Resume from HITL interrupt
 *   GET  /seo/drafts                — List pending HITL-interrupted drafts
 *   GET  /seo/status/:id            — Check execution status
 *   POST /admin/knowledge/seed      — Seed RAG knowledge base
 *   POST /admin/knowledge/query     — Query knowledge base
 *   POST /admin/scan                — Run Cisco Skill Scanner
 *
 * Authorization: Bearer session JWT from auth-store (Phase 91).
 */

import { getAuthToken } from './auth-store';

const SEO_BASE = import.meta.env.VITE_SEO_API_BASE || "https://api.referralsvc.com";

async function seoFetch(method, path, body) {
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
    res = await fetch(`${SEO_BASE}${path}`, opts);
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
      `SEO API Route Offline — expected JSON but received ${contentType || "unknown content-type"} from ${path}`
    );
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Health & Status
// ---------------------------------------------------------------------------

/** Service health — binding status, security posture, FinOps config. */
export function fetchSEOHealth() {
  return seoFetch("GET", "/health");
}

/** Check execution status by ID. */
export function fetchSEOStatus(executionId) {
  return seoFetch("GET", `/seo/status/${encodeURIComponent(executionId)}`);
}

/** Fetch full execution state (CLI-reviewer mode) for a given ID. */
export function fetchSEOFullState(executionId) {
  return seoFetch("GET", `/seo/status/${encodeURIComponent(executionId)}?full=true`);
}

// ---------------------------------------------------------------------------
// Authority Loop — Execute & Resume
// ---------------------------------------------------------------------------

/** Trigger a new Authority Loop execution. */
export function triggerSEORun(contentType = "blog_article", topic = undefined) {
  return seoFetch("POST", "/seo/run", {
    contentType,
    ...(topic ? { topic } : {}),
  });
}

/** Resume a HITL-interrupted execution (approve & syndicate). */
export function resumeSEOExecution(executionId, overrides = undefined) {
  return seoFetch("POST", "/seo/resume", {
    executionId,
    ...(overrides ? { overrides } : {}),
  });
}

// ---------------------------------------------------------------------------
// HITL Drafts
// ---------------------------------------------------------------------------

/** List all pending HITL-interrupted drafts awaiting human approval. */
export function fetchSEODrafts() {
  return seoFetch("GET", "/seo/drafts");
}

// ---------------------------------------------------------------------------
// Knowledge Ops (Admin)
// ---------------------------------------------------------------------------

/** Seed the RAG knowledge base with brand voice, business rules, etc. */
export function seedKnowledgeBase() {
  return seoFetch("POST", "/admin/knowledge/seed");
}

/** Query the RAG knowledge base for debugging/verification. */
export function queryKnowledgeBase(query, topK = 5) {
  return seoFetch("POST", "/admin/knowledge/query", { query, topK });
}

// ---------------------------------------------------------------------------
// Strategic Planning
// ---------------------------------------------------------------------------

/** Trigger the Strategic Planning Moltworker — 3-Pillar executive roadmap. */
export function triggerStrategyRoadmap(finOps = undefined) {
  return seoFetch("POST", "/seo/strategy", finOps ? { finOps } : {});
}

// ---------------------------------------------------------------------------
// Security (Admin)
// ---------------------------------------------------------------------------

/** Run the Cisco Skill Scanner on provided source code. */
export function scanSkill(skillName, sourceCode) {
  return seoFetch("POST", "/admin/scan", { skillName, sourceCode });
}

// ---------------------------------------------------------------------------
// CRM-Side Draft Management (CEO HITL via svcbot-sandbox admin router)
// ---------------------------------------------------------------------------

const CRM_BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

/**
 * Approve or reject an SEO draft via the CRM admin endpoint.
 * Works for both Authority Loop and Gemini-submitted drafts.
 * @param {string} draftId - The draft UUID
 * @param {'approved'|'rejected'} action
 * @param {object} [opts] - Optional { edit_notes, draft_body, title }
 */
export async function patchSeoDraft(draftId, action, opts = {}) {
  const token = sessionStorage.getItem("rsllc_ceo_jwt");
  // Decode CEO email from JWT (rsllc_ceo_email is never set; auth stores rsllc_ceo_jwt)
  let ceoEmail = "";
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      ceoEmail = payload.email || payload.sub || "";
    }
  } catch { /* fallback to empty */ }
  const res = await fetch(`${CRM_BASE}/api/v1/admin/seo/draft/${encodeURIComponent(draftId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-partner-email": ceoEmail,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...opts }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}
