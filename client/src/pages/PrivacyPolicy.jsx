import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        {/* Back nav */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Header */}
          <motion.div variants={fadeUp} className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Shield size={20} className="text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Legal
              </span>
            </div>
            <h1 className="gradient-text mb-3 text-4xl font-extrabold md:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-sm text-white/40">
              Effective Date: January 1, 2025 &middot; Last Updated: February 2026
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            variants={fadeUp}
            className="glass noise rounded-2xl p-8 md:p-12"
          >
            <div className="prose-legal space-y-8 text-sm leading-relaxed text-white/70">
              {/* 1 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  1. Introduction
                </h2>
                <p>
                  Referral Service LLC ("Company," "we," "us," or "our") operates
                  an AI-Human Hybrid venture studio platform accessible at
                  referralsvc.com. This Privacy Policy describes how we collect,
                  use, disclose, and protect your personal information when you
                  interact with our platform, including our autonomous AI agent
                  known as "Clawbot" and any related services, communications, or
                  digital workforce modules.
                </p>
                <p className="mt-3">
                  By using our services, you acknowledge that you have read and
                  understood this Privacy Policy. If you do not agree, please
                  discontinue use of the platform.
                </p>
              </section>

              {/* 2 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  2. Information We Collect
                </h2>
                <p className="font-semibold text-white/90 mb-2">
                  2.1 Information You Provide Directly
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    Name, email address, phone number, business name, and job
                    title when you submit an inquiry, register, or engage with
                    our SDR modules.
                  </li>
                  <li>
                    Communications content including SMS messages, email replies,
                    and chat transcripts exchanged with our AI agents or human
                    personnel.
                  </li>
                  <li>
                    Business qualification data you provide through intake forms,
                    BQM (Business Qualification Matrix) scoring, or onboarding
                    workflows.
                  </li>
                </ul>

                <p className="font-semibold text-white/90 mb-2 mt-4">
                  2.2 Information Collected Automatically
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    Device and browser data (IP address, browser type, operating
                    system, referring URL).
                  </li>
                  <li>
                    Usage analytics (pages visited, session duration, click
                    patterns, feature interactions).
                  </li>
                  <li>
                    AI interaction metadata including Triage Engine scoring
                    outputs, intent classification results, and conversation
                    routing decisions.
                  </li>
                </ul>

                <p className="font-semibold text-white/90 mb-2 mt-4">
                  2.3 Information from Third Parties
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    Publicly available business data used to enrich lead
                    profiles for qualification purposes.
                  </li>
                  <li>
                    Referral data from Sovereign Professionals (independent
                    contractors) who submit leads on behalf of their networks.
                  </li>
                </ul>
              </section>

              {/* 3 — CCPA ADMT */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  3. Automated Decision-Making Technology (ADMT) &mdash; CCPA
                  Disclosure
                </h2>
                <p>
                  Pursuant to the California Consumer Privacy Act (CCPA) and the
                  California Privacy Rights Act (CPRA), including regulations
                  governing Automated Decision-Making Technology (ADMT), we
                  disclose the following:
                </p>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="font-semibold text-white/90 mb-2">
                    3.1 Clawbot Intent Scoring
                  </p>
                  <p>
                    Our AI agent "Clawbot" utilizes automated decision-making
                    technology to score and classify inbound and outbound leads.
                    The Triage Engine assigns an intent score (0.0&ndash;1.0) to
                    each prospect based on factors including: message content
                    analysis, engagement signals, business qualification data,
                    and historical interaction patterns. Leads scoring above the
                    configured threshold are automatically routed for outreach or
                    escalation.
                  </p>

                  <p className="font-semibold text-white/90 mb-2 mt-4">
                    3.2 Purpose and Impact
                  </p>
                  <p>
                    ADMT is used to prioritize sales outreach, personalize
                    communications, and determine routing within our pipeline.
                    These automated processes may affect which prospects receive
                    outreach communications, the timing and channel of those
                    communications, and how leads are categorized within our
                    system.
                  </p>

                  <p className="font-semibold text-white/90 mb-2 mt-4">
                    3.3 Your ADMT Rights
                  </p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>
                      <strong>Right to Opt Out:</strong> You may opt out of
                      automated decision-making by contacting us at
                      privacy@referralsvc.com. Upon request, we will cease
                      automated profiling and route your interactions to human
                      personnel only.
                    </li>
                    <li>
                      <strong>Right to Access:</strong> You may request a
                      summary of the logic, data inputs, and outputs involved
                      in any automated decision made about you.
                    </li>
                    <li>
                      <strong>Right to Human Review:</strong> You may request
                      that a qualified human reviewer evaluate any automated
                      decision that significantly affects you.
                    </li>
                  </ul>
                </div>
              </section>

              {/* 4 — TCPA / SMS */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  4. SMS/Text Messaging &mdash; TCPA &amp; CTIA Compliance
                </h2>
                <p>
                  Our platform uses Twilio-powered SMS communications for lead
                  outreach, appointment reminders, and transactional
                  notifications. We comply with the Telephone Consumer
                  Protection Act (TCPA) and the Cellular Telecommunications
                  Industry Association (CTIA) Messaging Principles:
                </p>
                <ul className="ml-4 mt-3 list-disc space-y-2">
                  <li>
                    <strong>Express Consent Required:</strong> We will not send
                    marketing or promotional SMS messages without your prior
                    express written consent obtained through a compliant opt-in
                    mechanism.
                  </li>
                  <li>
                    <strong>Opt-Out:</strong> You may opt out of SMS
                    communications at any time by replying <strong>STOP</strong>{" "}
                    to any message. Upon receipt, we will confirm your removal
                    and cease all non-transactional SMS within 24 hours.
                  </li>
                  <li>
                    <strong>Help:</strong> Reply <strong>HELP</strong> to any
                    message for support contact information.
                  </li>
                  <li>
                    <strong>Message Frequency:</strong> Message frequency varies
                    based on engagement level. Standard message and data rates
                    may apply.
                  </li>
                  <li>
                    <strong>No SMS for Sensitive Data:</strong> We will never
                    request Social Security numbers, banking information, or
                    passwords via SMS.
                  </li>
                </ul>
              </section>

              {/* 5 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  5. How We Use Your Information
                </h2>
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    Operate, maintain, and improve our AI-Human Hybrid platform
                    and digital workforce modules.
                  </li>
                  <li>
                    Score, classify, and route leads through our Triage Engine
                    and orchestration pipeline.
                  </li>
                  <li>
                    Communicate with you via SMS, email, or other channels
                    regarding services, appointments, or inquiries.
                  </li>
                  <li>
                    Train and improve our AI models using aggregated,
                    de-identified interaction data.
                  </li>
                  <li>
                    Comply with legal obligations, enforce our terms, and protect
                    against fraud or misuse.
                  </li>
                  <li>
                    Generate analytics and FinOps telemetry to monitor system
                    performance, cost-per-lead, and pipeline health.
                  </li>
                </ul>
              </section>

              {/* 6 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  6. Data Sharing and Disclosure
                </h2>
                <p>
                  We do not sell your personal information. We may share data
                  with:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-1">
                  <li>
                    <strong>Service Providers:</strong> Twilio (SMS), Resend
                    (email), Cloudflare (infrastructure), and Railway
                    (hosting) who process data on our behalf under contractual
                    obligations.
                  </li>
                  <li>
                    <strong>Sovereign Professionals:</strong> Independent
                    contractors who may receive limited lead information
                    necessary to fulfill referral and service obligations.
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law,
                    subpoena, or government request, or to protect our rights,
                    safety, or property.
                  </li>
                </ul>
              </section>

              {/* 7 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  7. Data Retention
                </h2>
                <p>
                  We retain personal information for as long as necessary to
                  fulfill the purposes described in this Policy, comply with
                  legal obligations, resolve disputes, and enforce agreements.
                  Lead interaction data and AI scoring outputs are retained for a
                  minimum of 24 months for model improvement and audit purposes.
                  You may request deletion at any time subject to our legal
                  retention requirements.
                </p>
              </section>

              {/* 8 — Revocation SLA */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  8. Your Rights &amp; 10-Day Revocation SLA
                </h2>
                <p>
                  Depending on your jurisdiction, you may have the following
                  rights:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-1">
                  <li>Right to access, correct, or delete your personal data.</li>
                  <li>Right to restrict or object to processing.</li>
                  <li>Right to data portability.</li>
                  <li>
                    Right to opt out of automated decision-making (see Section
                    3).
                  </li>
                  <li>
                    Right to opt out of SMS marketing (see Section 4).
                  </li>
                </ul>
                <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
                  <p className="font-semibold text-accent">
                    10-Day Revocation Guarantee
                  </p>
                  <p className="mt-1">
                    Upon receipt of a verified revocation or deletion request, we
                    commit to processing your request within ten (10) business
                    days. This includes ceasing all automated processing,
                    removing your data from active systems, and confirming
                    completion in writing. Residual copies in encrypted backups
                    will be purged within 90 days.
                  </p>
                </div>
              </section>

              {/* 9 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  9. Security
                </h2>
                <p>
                  We employ industry-standard security measures including
                  encryption in transit (TLS 1.3) and at rest, access controls
                  with constant-time token comparison, service-level
                  authentication between internal systems, and regular security
                  assessments. However, no method of electronic transmission or
                  storage is 100% secure, and we cannot guarantee absolute
                  security.
                </p>
              </section>

              {/* 10 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  10. Children's Privacy
                </h2>
                <p>
                  Our platform is not directed to individuals under the age of
                  18. We do not knowingly collect personal information from
                  minors. If we learn that we have collected data from a child
                  under 18, we will delete that information promptly.
                </p>
              </section>

              {/* 11 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  11. Changes to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. Material
                  changes will be posted on this page with an updated effective
                  date. Your continued use of the platform after any changes
                  constitutes acceptance of the revised policy.
                </p>
              </section>

              {/* 12 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  12. Contact Us
                </h2>
                <p>
                  For questions, requests, or complaints regarding this Privacy
                  Policy or your personal data:
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  <p className="font-semibold">Referral Service LLC</p>
                  <p>Attn: Privacy Officer</p>
                  <p>Email: privacy@referralsvc.com</p>
                  <p>Website: referralsvc.com</p>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
