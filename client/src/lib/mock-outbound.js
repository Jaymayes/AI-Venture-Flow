/**
 * mock-outbound.js — Mock data payloads for the ToFu Radar Command Center.
 *
 * Feeds LeadBriefings.jsx while API wiring is finalized.
 * Toggle USE_MOCK in the component to switch to live /api/outbound/* endpoints.
 *
 * Data payloads:
 *   1. MOCK_BOUNCER_STATS — AI Bouncer funnel metrics + FinOps savings
 *   2. MOCK_ACTIVE_GRAPH — Prospects in the LangGraph state machine
 *   3. MOCK_TRIAGE_QUEUE — Prospects who replied, crossing the Event Bridge
 *   4. MOCK_INGESTION_FUNNEL — Apollo → Proxycurl staged ingestion breakdown
 */

// ---------------------------------------------------------------------------
// 1. AI Bouncer Funnel Stats
// ---------------------------------------------------------------------------

export const MOCK_BOUNCER_STATS = {
  /** Leads that passed both deterministic pre-filter and LLM ICP check */
  allowed: 142,
  /** Leads rejected by deterministic pre-filter (zero tokens spent) */
  rejectedDeterministic: 890,
  /** Leads rejected by LLM ICP filter (Llama 3.1 8B, ~$0.000045/call) */
  rejectedLLM: 312,
  /** Total leads ingested through Apollo + Proxycurl */
  totalIngested: 1344,
  /** USD saved by rejecting bad leads before engagement graph tokens */
  computeCapitalDefendedUSD: 14.85,
  /** Average cost per ICP filter call (LLM stage only) */
  avgFilterCostUSD: 0.000045,
  /** Total ICP filter compute cost */
  totalFilterCostUSD: 0.0204,
  /** Pass rate percentage */
  passRate: 10.57,
  /** Ingestion breakdown by source */
  ingestionSources: {
    apollo: { total: 1230, passedPreFilter: 412 },
    proxycurl: { enriched: 412, llmFiltered: 142 },
    manual: { total: 114, passedPreFilter: 42 },
  },
};

// ---------------------------------------------------------------------------
// 2. Active Engagement Graph — Prospects in LangGraph State Machine
// ---------------------------------------------------------------------------

export const MOCK_ACTIVE_GRAPH = [
  {
    id: "eng-001",
    name: "Sarah Chen",
    company: "Acme AI",
    role: "VP of Engineering",
    currentState: "Signal Analysis",
    channel: "email",
    touchCount: 0,
    maxTouches: 5,
    sentimentScore: null,
    lastActivityAt: new Date(Date.now() - 1200000).toISOString(),
    icpConfidence: 92,
    industry: "AI/ML",
  },
  {
    id: "eng-002",
    name: "Marcus Rivera",
    company: "DataForge",
    role: "CTO",
    currentState: "Drafting",
    channel: "email",
    touchCount: 1,
    maxTouches: 5,
    sentimentScore: null,
    lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
    icpConfidence: 88,
    industry: "Data Analytics",
  },
  {
    id: "eng-003",
    name: "Priya Patel",
    company: "HealthBridge",
    role: "CEO",
    currentState: "Quality Gate",
    channel: "email",
    touchCount: 1,
    maxTouches: 5,
    sentimentScore: null,
    lastActivityAt: new Date(Date.now() - 7200000).toISOString(),
    icpConfidence: 95,
    industry: "HealthTech",
  },
  {
    id: "eng-004",
    name: "James O'Brien",
    company: "CloudStack Pro",
    role: "Head of Growth",
    currentState: "Dispatched",
    channel: "linkedin",
    touchCount: 2,
    maxTouches: 5,
    sentimentScore: 0.45,
    lastActivityAt: new Date(Date.now() - 43200000).toISOString(),
    icpConfidence: 82,
    industry: "Cloud Infrastructure",
  },
  {
    id: "eng-005",
    name: "Aisha Nakamura",
    company: "FinLeap",
    role: "VP Sales",
    currentState: "Cooldown",
    channel: "email",
    touchCount: 2,
    maxTouches: 5,
    sentimentScore: 0.62,
    lastActivityAt: new Date(Date.now() - 86400000).toISOString(),
    icpConfidence: 90,
    industry: "FinTech",
    cooldownEndsAt: new Date(Date.now() + 86400000).toISOString(),
    emailOpened: true,
    linkClicked: false,
  },
  {
    id: "eng-006",
    name: "Daniel Kim",
    company: "CyberVault",
    role: "Founder",
    currentState: "Signal Analysis",
    channel: "linkedin",
    touchCount: 1,
    maxTouches: 5,
    sentimentScore: null,
    lastActivityAt: new Date(Date.now() - 900000).toISOString(),
    icpConfidence: 87,
    industry: "Cybersecurity",
  },
  {
    id: "eng-007",
    name: "Elena Vasquez",
    company: "MarketPulse",
    role: "CMO",
    currentState: "Drafting",
    channel: "email",
    touchCount: 3,
    maxTouches: 5,
    sentimentScore: 0.38,
    lastActivityAt: new Date(Date.now() - 14400000).toISOString(),
    icpConfidence: 78,
    industry: "MarTech",
  },
  {
    id: "eng-008",
    name: "Thomas Andersen",
    company: "NordAPI",
    role: "CTO",
    currentState: "Dispatched",
    channel: "email",
    touchCount: 1,
    maxTouches: 5,
    sentimentScore: null,
    lastActivityAt: new Date(Date.now() - 21600000).toISOString(),
    icpConfidence: 91,
    industry: "B2B Software",
  },
  {
    id: "eng-009",
    name: "Lisa Zhang",
    company: "Quantum Mesh",
    role: "VP Engineering",
    currentState: "Cooldown",
    channel: "linkedin",
    touchCount: 3,
    maxTouches: 5,
    sentimentScore: 0.55,
    lastActivityAt: new Date(Date.now() - 172800000).toISOString(),
    icpConfidence: 85,
    industry: "Enterprise Software",
    cooldownEndsAt: new Date(Date.now() + 43200000).toISOString(),
    emailOpened: true,
    linkClicked: true,
  },
  {
    id: "eng-010",
    name: "Robert Hughes",
    company: "ScaleOps",
    role: "Head of Engineering",
    currentState: "Quality Gate",
    channel: "email",
    touchCount: 4,
    maxTouches: 5,
    sentimentScore: 0.32,
    lastActivityAt: new Date(Date.now() - 10800000).toISOString(),
    icpConfidence: 74,
    industry: "SaaS",
  },
  {
    id: "eng-011",
    name: "Nina Rossi",
    company: "BioSynth",
    role: "CEO",
    currentState: "Signal Analysis",
    channel: "email",
    touchCount: 0,
    maxTouches: 5,
    sentimentScore: null,
    lastActivityAt: new Date(Date.now() - 600000).toISOString(),
    icpConfidence: 96,
    industry: "HealthTech",
  },
  {
    id: "eng-012",
    name: "Kevin Park",
    company: "PropelAI",
    role: "Co-Founder",
    currentState: "Dispatched",
    channel: "email",
    touchCount: 1,
    maxTouches: 5,
    sentimentScore: null,
    lastActivityAt: new Date(Date.now() - 5400000).toISOString(),
    icpConfidence: 89,
    industry: "AI/ML",
  },
  {
    id: "eng-013",
    name: "Amanda Foster",
    company: "RevGenius",
    role: "VP Revenue",
    currentState: "Cooldown",
    channel: "email",
    touchCount: 2,
    maxTouches: 5,
    sentimentScore: 0.71,
    lastActivityAt: new Date(Date.now() - 129600000).toISOString(),
    icpConfidence: 83,
    industry: "SaaS",
    cooldownEndsAt: new Date(Date.now() + 72000000).toISOString(),
    emailOpened: false,
    linkClicked: false,
  },
];

// ---------------------------------------------------------------------------
// 3. Triage Queue — Prospects who replied (crossed Event Bridge)
// ---------------------------------------------------------------------------

export const MOCK_TRIAGE_QUEUE = [
  {
    id: "triage-001",
    name: "Raj Gupta",
    company: "LogicLayer",
    role: "CTO",
    intentScore: 92,
    sentimentLabel: "excited",
    sentimentValence: 0.85,
    replyChannel: "email",
    repliedAt: new Date(Date.now() - 3600000).toISOString(),
    touchesBeforeReply: 2,
    engagementDurationDays: 5,
    sectionZeroPromise: "I noticed LogicLayer just closed your Series A — congrats. Most CTOs at your stage are drowning in outbound while trying to ship v2. We built an autonomous SDR that handles the entire top-of-funnel so your engineers never context-switch.",
    assignedSP: null,
    scheduleHumanPartner: true,
    humanPartnerReason: "Intent Score 92/100 exceeds threshold 85",
  },
  {
    id: "triage-002",
    name: "Michelle Torres",
    company: "Apex Revenue",
    role: "VP Sales",
    intentScore: 88,
    sentimentLabel: "curious",
    sentimentValence: 0.45,
    replyChannel: "linkedin",
    repliedAt: new Date(Date.now() - 7200000).toISOString(),
    touchesBeforeReply: 3,
    engagementDurationDays: 9,
    sectionZeroPromise: "Your LinkedIn post about scaling SDR teams caught my eye. What if you could 10x outbound volume without hiring a single rep? Our AI agents handle prospecting, personalization, and follow-up autonomously.",
    assignedSP: null,
    scheduleHumanPartner: true,
    humanPartnerReason: "Intent Score 88/100 exceeds threshold 85",
  },
  {
    id: "triage-003",
    name: "Victor Okafor",
    company: "PipelineIQ",
    role: "CEO",
    intentScore: 78,
    sentimentLabel: "anxious",
    sentimentValence: -0.3,
    replyChannel: "email",
    repliedAt: new Date(Date.now() - 14400000).toISOString(),
    touchesBeforeReply: 1,
    engagementDurationDays: 2,
    sectionZeroPromise: "PipelineIQ is hiring 4 SDRs right now. That's ~$280K/yr in fully loaded cost. What if an AI agent could cover that pipeline at 1/10th the cost with zero ramp time?",
    assignedSP: null,
    scheduleHumanPartner: false,
    humanPartnerReason: null,
  },
  {
    id: "triage-004",
    name: "Sophie Laurent",
    company: "TrustGrid",
    role: "Head of Partnerships",
    intentScore: 95,
    sentimentLabel: "urgent",
    sentimentValence: 0.72,
    replyChannel: "email",
    repliedAt: new Date(Date.now() - 1800000).toISOString(),
    touchesBeforeReply: 2,
    engagementDurationDays: 4,
    sectionZeroPromise: "TrustGrid's expansion into APAC means you need pipeline in 3 new markets simultaneously. Manual SDR teams can't scale that fast — our autonomous agents can run localized outreach across all 3 markets from day one.",
    assignedSP: null,
    scheduleHumanPartner: true,
    humanPartnerReason: "Intent Score 95/100 exceeds threshold 85; Sentiment Emergency: urgency surge",
  },
  {
    id: "triage-005",
    name: "Alex Chen-Wu",
    company: "NeuralOps",
    role: "Co-Founder",
    intentScore: 86,
    sentimentLabel: "curious",
    sentimentValence: 0.35,
    replyChannel: "email",
    repliedAt: new Date(Date.now() - 28800000).toISOString(),
    touchesBeforeReply: 4,
    engagementDurationDays: 14,
    sectionZeroPromise: "Saw your breakup email and had to respond — your AI agent pitch actually made me rethink our outbound strategy. We've been burning through SDR hires every quarter.",
    assignedSP: null,
    scheduleHumanPartner: true,
    humanPartnerReason: "Intent Score 86/100 exceeds threshold 85",
  },
];

// ---------------------------------------------------------------------------
// 4. Ingestion Funnel — Apollo → Proxycurl staged breakdown
// ---------------------------------------------------------------------------

export const MOCK_INGESTION_FUNNEL = [
  { stage: "Apollo Ingested", count: 1230, color: "#6d5cff" },
  { stage: "Deterministic Pass", count: 412, color: "#8b7fff" },
  { stage: "Proxycurl Enriched", count: 412, color: "#00e5a0" },
  { stage: "LLM ICP Pass", count: 142, color: "#00c48c" },
  { stage: "Engagement Active", count: 98, color: "#0ea5e9" },
  { stage: "Replied (Triage)", count: 5, color: "#f59e0b" },
];
