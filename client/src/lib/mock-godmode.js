/**
 * mock-godmode.js — Mock data payloads for CEO God-Mode Dashboard
 *
 * Revenue Salvage, SecOps Ledger, Compression ROI, and SP Efficacy Matrix.
 * Toggle USE_MOCK in each component to switch between mock and live data.
 */

// ---------------------------------------------------------------------------
// Revenue Salvage: 21-Day Burn-Down Kanban
// ---------------------------------------------------------------------------

export const MOCK_DEALS = [
  {
    id: "deal-001",
    prospectName: "TechFlow Solutions",
    prospectCompany: "TechFlow Inc.",
    spName: "Sarah Chen",
    spEmail: "sarah@techflow.io",
    tcv: 48000,
    daysSinceHandoff: 3,
    stage: "discovery",
    sentimentScore: 0.72,
    sentimentDelta: 0.05,
    lastContactAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    channel: "email",
  },
  {
    id: "deal-002",
    prospectName: "Meridian Healthcare",
    prospectCompany: "Meridian Corp.",
    spName: "Marcus Webb",
    spEmail: "marcus@meridian.com",
    tcv: 96000,
    daysSinceHandoff: 8,
    stage: "proposal",
    sentimentScore: 0.65,
    sentimentDelta: -0.12,
    lastContactAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    channel: "email",
  },
  {
    id: "deal-003",
    prospectName: "Apex Manufacturing",
    prospectCompany: "Apex Mfg LLC",
    spName: "Dana Torres",
    spEmail: "dana@apexmfg.com",
    tcv: 72000,
    daysSinceHandoff: 13,
    stage: "negotiation",
    sentimentScore: 0.41,
    sentimentDelta: -0.38,
    lastContactAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    channel: "sms",
    sentimentAlert: "frustration_spike",
  },
  {
    id: "deal-004",
    prospectName: "Pinnacle Logistics",
    prospectCompany: "Pinnacle Group",
    spName: "Sarah Chen",
    spEmail: "sarah@techflow.io",
    tcv: 120000,
    daysSinceHandoff: 16,
    stage: "stalled",
    sentimentScore: 0.29,
    sentimentDelta: -0.55,
    lastContactAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    channel: "email",
    sentimentAlert: "frustration_spike",
  },
  {
    id: "deal-005",
    prospectName: "Cobalt Fintech",
    prospectCompany: "Cobalt Inc.",
    spName: "Marcus Webb",
    spEmail: "marcus@meridian.com",
    tcv: 84000,
    daysSinceHandoff: 19,
    stage: "stalled",
    sentimentScore: 0.18,
    sentimentDelta: -0.62,
    lastContactAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    channel: "email",
    sentimentAlert: "disengagement",
  },
  {
    id: "deal-006",
    prospectName: "NovaTech AI",
    prospectCompany: "NovaTech Corp.",
    spName: "Dana Torres",
    spEmail: "dana@apexmfg.com",
    tcv: 156000,
    daysSinceHandoff: 21,
    stage: "stalled",
    sentimentScore: 0.08,
    sentimentDelta: -0.71,
    lastContactAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    channel: "email",
    sentimentAlert: "churn_imminent",
  },
  {
    id: "deal-007",
    prospectName: "Stratos Cloud",
    prospectCompany: "Stratos LLC",
    spName: "Sarah Chen",
    spEmail: "sarah@techflow.io",
    tcv: 64000,
    daysSinceHandoff: 6,
    stage: "discovery",
    sentimentScore: 0.81,
    sentimentDelta: 0.15,
    lastContactAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    channel: "sms",
  },
  {
    id: "deal-008",
    prospectName: "Quantum Dynamics",
    prospectCompany: "QD Corp.",
    spName: "Marcus Webb",
    spEmail: "marcus@meridian.com",
    tcv: 108000,
    daysSinceHandoff: 14,
    stage: "negotiation",
    sentimentScore: 0.35,
    sentimentDelta: -0.45,
    lastContactAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    channel: "email",
    sentimentAlert: "frustration_spike",
  },
];

// ---------------------------------------------------------------------------
// SecOps Ledger: Threat Feed + SP Liability Index
// ---------------------------------------------------------------------------

export const MOCK_THREAT_FEED = [
  {
    id: "scan-001",
    timestamp: new Date(Date.now() - 180000).toISOString(),
    spId: "SP-492",
    spName: "Marcus Webb",
    verdict: "BLOCKED",
    riskScore: 88,
    threatVector: "Exfiltration Attempt",
    skillName: "data-export-helper",
    deceptionAssessment: "Payload contains obfuscated fetch() call to external endpoint with base64-encoded KV keys.",
  },
  {
    id: "scan-002",
    timestamp: new Date(Date.now() - 420000).toISOString(),
    spId: "SP-317",
    spName: "Dana Torres",
    verdict: "BLOCKED",
    riskScore: 92,
    threatVector: "Credential Harvesting",
    skillName: "auth-sync-tool",
    deceptionAssessment: "Script attempts to read environment variables and POST to unregistered domain.",
  },
  {
    id: "scan-003",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    spId: "SP-492",
    spName: "Marcus Webb",
    verdict: "REVIEW",
    riskScore: 54,
    threatVector: "Suspicious Import",
    skillName: "pipeline-optimizer",
    deceptionAssessment: "Dynamic require() with user-controlled path. Low confidence exfiltration vector, may be legitimate config loader.",
  },
  {
    id: "scan-004",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    spId: "SP-205",
    spName: "Sarah Chen",
    verdict: "ALLOWED",
    riskScore: 12,
    threatVector: "None",
    skillName: "crm-sync",
    deceptionAssessment: "Clean payload. Standard REST API integration with approved endpoints.",
  },
  {
    id: "scan-005",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    spId: "SP-492",
    spName: "Marcus Webb",
    verdict: "BLOCKED",
    riskScore: 76,
    threatVector: "Privilege Escalation",
    skillName: "admin-helper-v2",
    deceptionAssessment: "Attempts to modify KV write permissions beyond SP scope. Escalation pattern detected.",
  },
  {
    id: "scan-006",
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    spId: "SP-317",
    spName: "Dana Torres",
    verdict: "REVIEW",
    riskScore: 48,
    threatVector: "Suspicious Pattern",
    skillName: "report-generator",
    deceptionAssessment: "Generates HTML with embedded script tags. Likely benign template rendering but XSS risk exists.",
  },
  {
    id: "scan-007",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    spId: "SP-128",
    spName: "Alex Petrov",
    verdict: "BLOCKED",
    riskScore: 95,
    threatVector: "Supply Chain Injection",
    skillName: "npm-audit-fix",
    deceptionAssessment: "Installs unsigned package from non-registry URL. Classic supply chain attack vector.",
  },
];

export const MOCK_SP_LIABILITY = [
  { spId: "SP-492", spName: "Marcus Webb", blocksThisWeek: 3, blocksTotal: 7, lastBlockAt: new Date(Date.now() - 180000).toISOString(), status: "flagged" },
  { spId: "SP-317", spName: "Dana Torres", blocksThisWeek: 2, blocksTotal: 4, lastBlockAt: new Date(Date.now() - 420000).toISOString(), status: "warning" },
  { spId: "SP-128", spName: "Alex Petrov", blocksThisWeek: 1, blocksTotal: 1, lastBlockAt: new Date(Date.now() - 7200000).toISOString(), status: "clean" },
  { spId: "SP-205", spName: "Sarah Chen", blocksThisWeek: 0, blocksTotal: 0, lastBlockAt: null, status: "clean" },
];

// ---------------------------------------------------------------------------
// Compression ROI Telemetry (FinOps widget injection)
// ---------------------------------------------------------------------------

export const MOCK_COMPRESSION = {
  actionableTokenRatio: 0.74,
  atrTarget: 0.70,
  phantomTokens24h: 847291,
  phantomTokens7d: 5184720,
  inferenceRate: 0.00000015, // USD per token (Workers AI edge)
  defendedCapital24h: 0.127, // 847291 * 0.00000015
  defendedCapital7d: 0.778,  // 5184720 * 0.00000015
  compressionPasses: 5,
  passBreakdown: {
    filler_removal: 0.31,
    redundant_history: 0.28,
    boilerplate_collapse: 0.19,
    semantic_dedup: 0.14,
    context_pruning: 0.08,
  },
};

// ---------------------------------------------------------------------------
// SP Psychological Efficacy Matrix (Recruitment Ops widget injection)
// ---------------------------------------------------------------------------

export const MOCK_SP_EFFICACY = [
  {
    spId: "SP-205",
    spName: "Sarah Chen",
    totalHandoffs: 24,
    sentimentDeltas: [0.15, 0.08, -0.02, 0.22, 0.11, -0.05, 0.18, 0.09],
    avgSentimentDelta: 0.095,
    emergencyFlags: 2,
    emergencyResolutions: 2,
    emergencyResolutionRate: 1.0,
    ceoOverrides: 0,
    ceoOverrideRate: 0.0,
    trend: "warming",
  },
  {
    spId: "SP-492",
    spName: "Marcus Webb",
    totalHandoffs: 18,
    sentimentDeltas: [-0.12, -0.38, 0.05, -0.55, -0.22, -0.08, -0.45, -0.15],
    avgSentimentDelta: -0.2375,
    emergencyFlags: 5,
    emergencyResolutions: 1,
    emergencyResolutionRate: 0.2,
    ceoOverrides: 3,
    ceoOverrideRate: 0.167,
    trend: "degrading",
  },
  {
    spId: "SP-317",
    spName: "Dana Torres",
    totalHandoffs: 15,
    sentimentDeltas: [-0.38, -0.62, 0.12, -0.18, 0.05, -0.71, -0.28, 0.02],
    avgSentimentDelta: -0.2475,
    emergencyFlags: 4,
    emergencyResolutions: 1,
    emergencyResolutionRate: 0.25,
    ceoOverrides: 2,
    ceoOverrideRate: 0.133,
    trend: "degrading",
  },
  {
    spId: "SP-128",
    spName: "Alex Petrov",
    totalHandoffs: 8,
    sentimentDeltas: [0.05, 0.12, -0.08, 0.18, 0.02, 0.09, -0.03, 0.14],
    avgSentimentDelta: 0.0613,
    emergencyFlags: 1,
    emergencyResolutions: 1,
    emergencyResolutionRate: 1.0,
    ceoOverrides: 0,
    ceoOverrideRate: 0.0,
    trend: "warming",
  },
];
