import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";

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

export default function Disclaimer() {
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
                <AlertTriangle size={20} className="text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Legal
              </span>
            </div>
            <h1 className="gradient-text mb-3 text-4xl font-extrabold md:text-5xl">
              Disclaimer
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
                  1. General Disclaimer
                </h2>
                <p>
                  The information, services, AI-generated content, and materials
                  provided on the referralsvc.com platform (the "Platform") by
                  Referral Service LLC ("Company," "we," "us," or "our") are
                  provided on an "AS IS" and "AS AVAILABLE" basis without
                  warranties of any kind, whether express, implied, or
                  statutory. The Company disclaims all warranties, including but
                  not limited to implied warranties of merchantability, fitness
                  for a particular purpose, non-infringement, and accuracy.
                </p>
              </section>

              {/* 2 — No Professional Advice */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  2. No Professional Advice
                </h2>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <p className="font-semibold text-accent mb-3">
                    Important: Read Carefully
                  </p>
                  <p>
                    Nothing on this Platform constitutes professional advice of
                    any kind. The Platform and its AI-powered services, including
                    but not limited to lead scoring, business qualification,
                    outreach recommendations, and pipeline analytics, are
                    informational and operational tools only. Specifically:
                  </p>
                  <ul className="ml-4 mt-3 list-disc space-y-2">
                    <li>
                      <strong>Not Legal Advice:</strong> Content on this
                      Platform, including these legal pages, is not a substitute
                      for professional legal counsel. You should consult a
                      licensed attorney for legal questions specific to your
                      situation.
                    </li>
                    <li>
                      <strong>Not Financial Advice:</strong> Pricing
                      information, cost-per-lead metrics, FinOps telemetry, ROI
                      projections, and revenue analytics are provided for
                      informational purposes only and do not constitute
                      financial, investment, or accounting advice.
                    </li>
                    <li>
                      <strong>Not Tax Advice:</strong> Information regarding
                      1099 independent contractor classifications, Sovereign
                      Professional arrangements, and tax-related references are
                      general in nature and do not constitute tax advice. Consult
                      a qualified tax professional.
                    </li>
                    <li>
                      <strong>Not Business Consulting:</strong> BQM scores, lead
                      qualification ratings, and AI-generated business
                      assessments are automated outputs and should not be relied
                      upon as professional business consulting or strategic
                      advisory services.
                    </li>
                  </ul>
                </div>
              </section>

              {/* 3 — AI Outputs */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  3. AI Outputs Are Probabilistic
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="font-semibold text-white/90 mb-3">
                    3.1 Nature of AI-Generated Content
                  </p>
                  <p>
                    Our Platform utilizes large language models (LLMs),
                    autonomous AI agents (including "Clawbot"), and machine
                    learning algorithms to generate content, score leads,
                    classify intents, draft communications, and make routing
                    decisions. These AI systems produce outputs that are
                    inherently <strong>probabilistic</strong>&mdash;meaning they
                    are based on statistical patterns and are not deterministic or
                    guaranteed to be accurate, complete, or appropriate in every
                    context.
                  </p>

                  <p className="font-semibold text-white/90 mb-3 mt-4">
                    3.2 No Guarantee of Accuracy
                  </p>
                  <p>
                    AI-generated outputs may contain errors, inaccuracies,
                    omissions, or unintended content (commonly known as
                    "hallucinations"). The Company does not guarantee the
                    accuracy, reliability, completeness, or timeliness of any
                    AI-generated output. Users should independently verify all
                    AI outputs before relying on them for business decisions,
                    communications, or any other purpose.
                  </p>

                  <p className="font-semibold text-white/90 mb-3 mt-4">
                    3.3 Specific AI Disclaimers
                  </p>
                  <ul className="ml-4 list-disc space-y-2">
                    <li>
                      <strong>Intent Scores:</strong> Triage Engine intent
                      scores (0.0&ndash;1.0) are probabilistic assessments and
                      should not be treated as definitive measures of prospect
                      interest or purchase intent.
                    </li>
                    <li>
                      <strong>Drafted Communications:</strong> AI-drafted SMS
                      and email messages are generated suggestions that may
                      require human review and editing before sending.
                    </li>
                    <li>
                      <strong>BQM Scores:</strong> Business Qualification
                      Matrix scores are automated assessments based on available
                      data and should not be the sole basis for business
                      decisions.
                    </li>
                    <li>
                      <strong>Knowledge Retrieval:</strong> RAG-powered
                      knowledge operations retrieve and synthesize information
                      that may be outdated, incomplete, or contextually
                      inappropriate.
                    </li>
                  </ul>
                </div>
              </section>

              {/* 4 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  4. No Guarantee of Results
                </h2>
                <p>
                  The Company makes no representations or warranties regarding
                  specific business outcomes, lead conversion rates, revenue
                  generation, or return on investment from using the Platform.
                  Case studies, testimonials, or performance metrics referenced
                  on the Platform are illustrative only and do not guarantee
                  similar results for any user.
                </p>
              </section>

              {/* 5 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  5. Third-Party Services and Links
                </h2>
                <p>
                  The Platform may integrate with or contain links to
                  third-party services (including Twilio, Resend, Cloudflare,
                  and Railway). The Company does not endorse, control, or assume
                  responsibility for the content, privacy policies, or practices
                  of any third-party services. Your use of third-party services
                  is at your own risk and subject to their respective terms and
                  conditions.
                </p>
              </section>

              {/* 6 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  6. Availability and Interruptions
                </h2>
                <p>
                  We do not guarantee that the Platform will be available at all
                  times or operate without interruptions, errors, or defects.
                  The Platform may be subject to scheduled maintenance,
                  unscheduled downtime, or service disruptions. We are not
                  liable for any loss or damage resulting from Platform
                  unavailability.
                </p>
              </section>

              {/* 7 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  7. Limitation of Liability
                </h2>
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT
                  BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR EXEMPLARY DAMAGES ARISING FROM YOUR USE OF
                  THE PLATFORM, RELIANCE ON AI OUTPUTS, OR ANY INFORMATION
                  PROVIDED HEREIN. THIS INCLUDES DAMAGES FOR LOSS OF PROFITS,
                  GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES.
                </p>
              </section>

              {/* 8 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  8. Use at Your Own Risk
                </h2>
                <p>
                  Your use of the Platform, including any reliance on
                  AI-generated content, scoring, classifications, or
                  recommendations, is entirely at your own risk. You are solely
                  responsible for evaluating the accuracy, completeness, and
                  usefulness of any information or output provided by the
                  Platform.
                </p>
              </section>

              {/* 9 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  9. Contact Us
                </h2>
                <p>
                  If you have questions about this Disclaimer, please contact us:
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
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
