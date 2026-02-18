/**
 * mock-disbursements.js — Test payloads for the CEO Disbursement Dashboard.
 *
 * Three scenarios covering the complete gate matrix:
 *   1. Healthy: W-9 verified + margin healthy → executable
 *   2. W-9 Blocked: W-9 pending → button disabled
 *   3. Margin Degraded: margin < 0.80 → audit required
 *   4. Combined Block: W-9 pending AND margin degraded
 *   5. Recently Disbursed: completed payout with audit trail
 */

export const MOCK_COMMISSIONS = {
  pendingApproval: [
    {
      commissionId: "comm_1708300000_abc123",
      spCustomerId: "cus_SP_001",
      spConnectAccountId: "acct_connect_001",
      spName: "Alex Johnson",
      spBusinessEntity: "Johnson Consulting LLC",
      spEmail: "alex@johnsonconsulting.com",
      w9Status: "verified",
      deal: {
        clientName: "Meridian SaaS Corp",
        sowEnvelopeId: "env_docusign_001",
        tcvUSD: 150000,
        commissionPercent: 17.5,
        commissionUSD: 26250,
        firstPaymentDate: "2026-02-10",
      },
      marginHealth: {
        grossMargin: 0.84,
        marginStatus: "healthy",
        cogsUSD: 24000,
        marginCheckPassed: true,
      },
      stagedAt: "2026-02-15T14:30:00.000Z",
      status: "staged",
    },
    {
      commissionId: "comm_1708300001_def456",
      spCustomerId: "cus_SP_002",
      spConnectAccountId: "acct_connect_002",
      spName: "Priya Sharma",
      spBusinessEntity: "Sharma GTM Strategy LLC",
      spEmail: "priya@sharmagtm.com",
      w9Status: "received",
      deal: {
        clientName: "NovaTech Industries",
        sowEnvelopeId: "env_docusign_002",
        tcvUSD: 75000,
        commissionPercent: 15,
        commissionUSD: 11250,
        firstPaymentDate: "2026-02-12",
      },
      marginHealth: {
        grossMargin: 0.91,
        marginStatus: "healthy",
        cogsUSD: 6750,
        marginCheckPassed: true,
      },
      stagedAt: "2026-02-16T09:15:00.000Z",
      status: "staged",
    },
  ],

  blocked: [
    {
      commissionId: "comm_1708300002_ghi789",
      spCustomerId: "cus_SP_003",
      spConnectAccountId: null,
      spName: "Marcus Chen",
      spBusinessEntity: "Chen Digital Ventures",
      spEmail: "marcus@chendigital.com",
      w9Status: "pending",
      deal: {
        clientName: "Apex Manufacturing Co",
        sowEnvelopeId: "env_docusign_003",
        tcvUSD: 250000,
        commissionPercent: 20,
        commissionUSD: 50000,
        firstPaymentDate: "2026-02-08",
      },
      marginHealth: {
        grossMargin: 0.86,
        marginStatus: "healthy",
        cogsUSD: 35000,
        marginCheckPassed: true,
      },
      stagedAt: "2026-02-14T11:00:00.000Z",
      status: "blocked",
      blockReason:
        "W-9 not collected. SP must complete Stripe Connect onboarding before disbursement.",
    },
    {
      commissionId: "comm_1708300003_jkl012",
      spCustomerId: "cus_SP_004",
      spConnectAccountId: "acct_connect_004",
      spName: "Sarah Williams",
      spBusinessEntity: "Williams Advisory Group",
      spEmail: "sarah@williamsadvisory.com",
      w9Status: "verified",
      deal: {
        clientName: "Pinnacle Health Systems",
        sowEnvelopeId: "env_docusign_004",
        tcvUSD: 120000,
        commissionPercent: 17.5,
        commissionUSD: 21000,
        firstPaymentDate: "2026-02-05",
      },
      marginHealth: {
        grossMargin: 0.72,
        marginStatus: "margin-degraded",
        cogsUSD: 33600,
        marginCheckPassed: false,
      },
      stagedAt: "2026-02-13T16:45:00.000Z",
      status: "audit_required",
      blockReason:
        "Margin check failed: grossMargin=72.0% (target >=80%) | status=margin-degraded | COGS=$33600.00. Requires FinOps audit before disbursement.",
    },
  ],

  recentlyDisbursed: [
    {
      commissionId: "comm_1708200000_mno345",
      spCustomerId: "cus_SP_001",
      spConnectAccountId: "acct_connect_001",
      spName: "Alex Johnson",
      spBusinessEntity: "Johnson Consulting LLC",
      spEmail: "alex@johnsonconsulting.com",
      w9Status: "verified",
      deal: {
        clientName: "Vertex Cloud Solutions",
        sowEnvelopeId: "env_docusign_005",
        tcvUSD: 95000,
        commissionPercent: 15,
        commissionUSD: 14250,
        firstPaymentDate: "2026-01-20",
      },
      marginHealth: {
        grossMargin: 0.88,
        marginStatus: "healthy",
        cogsUSD: 11400,
        marginCheckPassed: true,
      },
      stagedAt: "2026-01-25T10:00:00.000Z",
      status: "disbursed",
      stripeTransferId: "tr_stripe_001",
      disbursedAt: "2026-01-28T14:22:00.000Z",
      approvedBy: "jamarr@referralsvc.com",
    },
  ],

  totals: {
    pendingCount: 2,
    pendingAmountUSD: 37500,
    blockedCount: 2,
    disbursedLast30Days: 1,
    disbursedAmountLast30Days: 14250,
  },
};
