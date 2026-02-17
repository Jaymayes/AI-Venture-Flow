import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Scale } from "lucide-react";

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

export default function TermsOfUse() {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Scale size={20} className="text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Legal
              </span>
            </div>
            <h1 className="gradient-text mb-3 text-4xl font-extrabold md:text-5xl">
              Terms of Use
            </h1>
            <p className="text-sm text-white/40">
              Effective Date: January 1, 2025 &middot; Last Updated: February 2026
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="glass noise rounded-2xl p-8 md:p-12"
          >
            <div className="prose-legal space-y-8 text-sm leading-relaxed text-white/70">
              {/* 1 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  1. Acceptance of Terms
                </h2>
                <p>
                  These Terms of Use ("Terms") constitute a legally binding
                  agreement between you ("User," "you," or "your") and Referral
                  Service LLC ("Company," "we," "us," or "our"), governing your
                  access to and use of the referralsvc.com platform, including
                  all AI-powered digital workforce modules, autonomous agents
                  (including "Clawbot"), APIs, dashboards, and related services
                  (collectively, the "Platform").
                </p>
                <p className="mt-3">
                  By accessing or using the Platform, you agree to be bound by
                  these Terms. If you do not agree, you must discontinue use
                  immediately.
                </p>
              </section>

              {/* 2 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  2. Description of Services
                </h2>
                <p>
                  The Platform provides AI-Human Hybrid venture studio services,
                  including but not limited to: autonomous AI sales development
                  representative (SDR) outreach, lead qualification and triage,
                  Business Qualification Matrix scoring, omni-channel
                  communications (SMS and email), Sovereign Professional
                  recruitment and management, FinOps telemetry and cost
                  analytics, and knowledge operations via RAG-powered retrieval.
                </p>
              </section>

              {/* 3 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  3. Eligibility
                </h2>
                <p>
                  You must be at least 18 years of age and have the legal
                  capacity to enter into a binding agreement to use the
                  Platform. By using the Platform, you represent and warrant
                  that you meet these requirements.
                </p>
              </section>

              {/* 4 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  4. User Accounts and Access
                </h2>
                <p>
                  Certain features of the Platform require authentication. You
                  are responsible for maintaining the confidentiality of your
                  access credentials (including any PIN, token, or password) and
                  for all activities that occur under your account. You agree to
                  notify us immediately of any unauthorized access or use.
                </p>
              </section>

              {/* 4B — SMS Messaging Program */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  4B. SMS Messaging Program
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="font-semibold text-white/90 mb-2">
                    Program Name
                  </p>
                  <p>
                    Referral Service LLC Talent Outreach Program
                  </p>

                  <p className="font-semibold text-white/90 mb-2 mt-4">
                    Program Description
                  </p>
                  <p>
                    Referral Service LLC sends personalized SMS messages to
                    business professionals regarding talent referral and
                    recruitment opportunities. Messages are initiated by
                    authorized company operators.
                  </p>

                  <p className="font-semibold text-white/90 mb-2 mt-4">
                    Message Frequency
                  </p>
                  <p>
                    Message frequency varies. Typically 1-3 messages per
                    prospect engagement. This is not a recurring subscription
                    program.
                  </p>

                  <p className="font-semibold text-white/90 mb-2 mt-4">
                    Message and Data Rates
                  </p>
                  <p>
                    Standard message and data rates may apply. Contact your
                    wireless carrier for details about your messaging plan.
                  </p>

                  <p className="font-semibold text-white/90 mb-2 mt-4">
                    Opt-Out
                  </p>
                  <p>
                    To stop receiving messages, reply{" "}
                    <strong className="text-white">STOP</strong> to any
                    message. You will receive a one-time confirmation message
                    and no further messages will be sent.
                  </p>

                  <p className="font-semibold text-white/90 mb-2 mt-4">
                    Help
                  </p>
                  <p>
                    For support, reply{" "}
                    <strong className="text-white">HELP</strong> to any
                    message, or contact us at support@referralsvc.com.
                  </p>

                  <p className="font-semibold text-white/90 mb-2 mt-4">
                    Privacy
                  </p>
                  <p>
                    Your information will not be shared with third parties for
                    marketing purposes. See our full{" "}
                    <Link href="/privacy" className="text-primary underline">
                      Privacy Policy
                    </Link>{" "}
                    for details.
                  </p>
                </div>
              </section>

              {/* 5 — AI Limitation of Liability */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  5. Agentic AI Limitation of Liability
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="font-semibold text-white/90 mb-3">
                    5.1 Nature of AI Outputs
                  </p>
                  <p>
                    You acknowledge and agree that the Platform utilizes
                    autonomous and semi-autonomous artificial intelligence
                    agents, including but not limited to the "Clawbot" SDR agent,
                    Triage Engine, and orchestration pipeline. These AI systems
                    generate outputs that are <strong>probabilistic in nature</strong> and
                    may include inaccuracies, errors, or unintended results
                    (commonly referred to as "hallucinations").
                  </p>

                  <p className="font-semibold text-white/90 mb-3 mt-4">
                    5.2 Disclaimer of AI Hallucinations
                  </p>
                  <p>
                    THE COMPANY EXPRESSLY DISCLAIMS ALL LIABILITY ARISING FROM OR
                    RELATED TO AI-GENERATED CONTENT, DECISIONS, SCORING,
                    CLASSIFICATIONS, COMMUNICATIONS, OR RECOMMENDATIONS THAT
                    CONTAIN INACCURACIES, ERRORS, OR HALLUCINATIONS. AI OUTPUTS
                    ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ACCURACY,
                    COMPLETENESS, OR FITNESS FOR A PARTICULAR PURPOSE.
                  </p>

                  <p className="font-semibold text-white/90 mb-3 mt-4">
                    5.3 Damages Cap
                  </p>
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE
                    COMPANY'S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS
                    ARISING OUT OF OR RELATED TO THE PLATFORM OR THESE TERMS,
                    WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT
                    LIABILITY, OR ANY OTHER LEGAL THEORY, SHALL NOT EXCEED THE
                    TOTAL FEES ACTUALLY PAID BY YOU TO THE COMPANY DURING THE
                    TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING
                    RISE TO THE CLAIM. IF NO FEES HAVE BEEN PAID, THE MAXIMUM
                    LIABILITY SHALL NOT EXCEED ONE HUNDRED DOLLARS ($100.00).
                  </p>

                  <p className="font-semibold text-white/90 mb-3 mt-4">
                    5.4 Exclusion of Consequential Damages
                  </p>
                  <p>
                    IN NO EVENT SHALL THE COMPANY BE LIABLE FOR ANY INDIRECT,
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                    INCLUDING BUT NOT LIMITED TO LOSS OF REVENUE, LOSS OF
                    PROFITS, LOSS OF BUSINESS, LOSS OF DATA, OR REPUTATIONAL
                    HARM, EVEN IF THE COMPANY HAS BEEN ADVISED OF THE
                    POSSIBILITY OF SUCH DAMAGES.
                  </p>
                </div>
              </section>

              {/* 6 — Independent Contractor */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  6. Sovereign Professional &mdash; 1099 Independent Contractor
                  Classification
                </h2>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <p className="font-semibold text-white/90 mb-3">
                    6.1 Independent Contractor Status
                  </p>
                  <p>
                    Any individual designated as a "Sovereign Professional" (SP)
                    on the Platform is and shall remain an independent
                    contractor. Nothing in these Terms, on the Platform, or in
                    any related agreement shall be construed to create an
                    employer-employee relationship, partnership, joint venture,
                    or agency relationship between the Company and any Sovereign
                    Professional.
                  </p>

                  <p className="font-semibold text-white/90 mb-3 mt-4">
                    6.2 Tax Obligations
                  </p>
                  <p>
                    Sovereign Professionals are solely responsible for reporting
                    and paying all applicable federal, state, and local taxes,
                    including self-employment taxes. The Company will issue IRS
                    Form 1099-NEC to qualifying Sovereign Professionals as
                    required by law. SPs are not entitled to employee benefits
                    including health insurance, retirement plans, workers'
                    compensation, or unemployment insurance from the Company.
                  </p>

                  <p className="font-semibold text-white/90 mb-3 mt-4">
                    6.3 Autonomy and Control
                  </p>
                  <p>
                    Sovereign Professionals retain full control over the manner,
                    means, and methods of performing their services. The Company
                    does not control work hours, work location, or the specific
                    processes used by SPs, except as necessary to ensure
                    compliance with applicable laws and platform standards.
                  </p>
                </div>
              </section>

              {/* 7 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  7. Acceptable Use
                </h2>
                <p>You agree not to:</p>
                <ul className="ml-4 mt-2 list-disc space-y-1">
                  <li>
                    Use the Platform for any unlawful, fraudulent, or
                    unauthorized purpose.
                  </li>
                  <li>
                    Attempt to reverse-engineer, decompile, or extract source
                    code from any AI models or proprietary algorithms.
                  </li>
                  <li>
                    Circumvent, disable, or interfere with security features,
                    authentication gates, or rate-limiting mechanisms.
                  </li>
                  <li>
                    Transmit malware, spam, or unsolicited commercial
                    communications through the Platform.
                  </li>
                  <li>
                    Use the Platform to harass, defame, or infringe upon the
                    rights of any third party.
                  </li>
                  <li>
                    Scrape, crawl, or extract data from the Platform without
                    express written permission.
                  </li>
                </ul>
              </section>

              {/* 8 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  8. Intellectual Property
                </h2>
                <p>
                  All content, software, AI models, algorithms, trade names,
                  trademarks, and proprietary materials on the Platform are owned
                  by or licensed to Referral Service LLC. You may not reproduce,
                  distribute, modify, or create derivative works without our
                  prior written consent. Nothing in these Terms grants you any
                  right, title, or interest in our intellectual property.
                </p>
              </section>

              {/* 9 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  9. Indemnification
                </h2>
                <p>
                  You agree to indemnify, defend, and hold harmless Referral
                  Service LLC, its officers, directors, employees, agents, and
                  affiliates from and against any claims, damages, losses,
                  liabilities, costs, and expenses (including reasonable
                  attorneys' fees) arising out of or related to your use of the
                  Platform, your violation of these Terms, or your infringement
                  of any third-party rights.
                </p>
              </section>

              {/* 10 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  10. Termination
                </h2>
                <p>
                  We reserve the right to suspend or terminate your access to
                  the Platform at any time, with or without cause, with or
                  without notice. Upon termination, all rights granted to you
                  under these Terms will immediately cease. Sections that by
                  their nature should survive termination (including limitation
                  of liability, indemnification, and governing law) shall
                  continue in full force and effect.
                </p>
              </section>

              {/* 11 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  11. Governing Law and Dispute Resolution
                </h2>
                <p>
                  These Terms shall be governed by and construed in accordance
                  with the laws of the State of Arizona, without regard to its
                  conflict of law provisions. Any dispute arising out of or
                  relating to these Terms or the Platform shall be resolved
                  through binding arbitration administered by the American
                  Arbitration Association (AAA) in Maricopa County, Arizona.
                  Each party shall bear its own costs and attorneys' fees unless
                  the arbitrator determines otherwise.
                </p>
              </section>

              {/* 12 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  12. Modifications
                </h2>
                <p>
                  We reserve the right to modify these Terms at any time.
                  Material changes will be posted on this page with an updated
                  effective date. Your continued use of the Platform after any
                  modification constitutes acceptance of the revised Terms.
                </p>
              </section>

              {/* 13 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  13. Contact Information
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  <p className="font-semibold">Referral Service LLC</p>
                  <p>Attn: Legal Department</p>
                  <p>Email: legal@referralsvc.com</p>
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
