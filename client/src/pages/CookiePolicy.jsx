import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Cookie } from "lucide-react";

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

const cookieCategories = [
  {
    name: "Strictly Necessary",
    required: true,
    description:
      "Essential for the Platform to function. These cookies enable core functionality such as session management, authentication gates (CEO PIN auth), and security features. They cannot be disabled.",
    examples: [
      "Session authentication tokens",
      "CSRF protection tokens",
      "Load balancer affinity cookies",
    ],
    retention: "Session or up to 24 hours",
  },
  {
    name: "Functional (AI Performance)",
    required: false,
    description:
      "These cookies collect behavioral and interaction data that is used to optimize the performance of our AI systems, including the Triage Engine intent scoring, Clawbot response calibration, and orchestration pipeline routing decisions. This data helps our AI agents deliver more relevant and personalized communications.",
    examples: [
      "Triage Engine interaction signals (page dwell time, click patterns, feature engagement)",
      "Clawbot conversation context identifiers",
      "BQM scoring session markers",
      "Lead qualification workflow state cookies",
    ],
    retention: "Up to 12 months",
  },
  {
    name: "Analytics & Performance",
    required: false,
    description:
      "These cookies help us understand how visitors interact with the Platform by collecting aggregated, anonymized usage data. This information is used for FinOps telemetry, cost-per-lead analysis, and platform optimization.",
    examples: [
      "Page view and session duration tracking",
      "Feature usage analytics",
      "Error and performance monitoring",
    ],
    retention: "Up to 24 months",
  },
  {
    name: "Marketing & Communications",
    required: false,
    description:
      "These cookies are used to track the effectiveness of outreach campaigns, measure SMS and email engagement, and attribute lead sources. They help us understand which channels and messages drive conversions.",
    examples: [
      "Campaign attribution identifiers",
      "Referral source tracking",
      "Email open and click tracking pixels",
    ],
    retention: "Up to 12 months",
  },
];

export default function CookiePolicy() {
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
                <Cookie size={20} className="text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Legal
              </span>
            </div>
            <h1 className="gradient-text mb-3 text-4xl font-extrabold md:text-5xl">
              Cookie Policy
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
                  1. What Are Cookies
                </h2>
                <p>
                  Cookies are small text files placed on your device when you
                  visit our Platform. They help us recognize your device,
                  remember preferences, and understand how you interact with our
                  services. We also use similar technologies such as local
                  storage, session storage, and pixel tags (collectively referred
                  to as "cookies" in this policy).
                </p>
              </section>

              {/* 2 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  2. How We Use Cookies
                </h2>
                <p>
                  Referral Service LLC uses cookies to operate and improve our
                  AI-Human Hybrid platform, personalize your experience, analyze
                  performance, power our AI systems, and measure the
                  effectiveness of our communications. Specific uses include
                  maintaining authenticated sessions, feeding behavioral signals
                  to our Triage Engine for lead scoring, tracking FinOps
                  telemetry metrics, and optimizing our autonomous AI agent
                  interactions.
                </p>
              </section>

              {/* 3 — Cookie categories */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  3. Cookie Categories
                </h2>
                <p className="mb-4">
                  We categorize cookies into four types. Each category serves a
                  distinct purpose in our platform operations:
                </p>

                <div className="space-y-4">
                  {cookieCategories.map((cat) => (
                    <div
                      key={cat.name}
                      className={`rounded-xl border p-5 ${
                        cat.name === "Functional (AI Performance)"
                          ? "border-accent/30 bg-accent/5"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-bold text-white">{cat.name}</h3>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                            cat.required
                              ? "bg-white/10 text-white/60"
                              : "bg-accent/20 text-accent"
                          }`}
                        >
                          {cat.required ? "Always Active" : "Optional"}
                        </span>
                      </div>
                      <p className="mb-3">{cat.description}</p>
                      <p className="font-semibold text-white/90 mb-1">
                        Examples:
                      </p>
                      <ul className="ml-4 list-disc space-y-1 mb-2">
                        {cat.examples.map((ex) => (
                          <li key={ex}>{ex}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-white/40">
                        Retention: {cat.retention}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4 — AI Performance detail */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  4. Functional (AI Performance) Cookies &mdash; Detailed
                  Disclosure
                </h2>
                <p>
                  Our "Functional (AI Performance)" cookies are specifically
                  designed to feed behavioral and interaction data to our AI
                  Triage Engine. This data is used to:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-2">
                  <li>
                    <strong>Calculate Intent Scores:</strong> Page engagement
                    patterns, feature interaction depth, and session behavior
                    are factored into the 0.0&ndash;1.0 intent score assigned by
                    our Triage Engine to determine lead qualification and
                    prioritization.
                  </li>
                  <li>
                    <strong>Optimize AI Routing:</strong> Behavioral signals
                    inform the orchestration pipeline's conditional routing
                    logic, helping determine whether a lead should receive
                    automated outreach, be escalated to a human Sovereign
                    Professional, or enter a nurture sequence.
                  </li>
                  <li>
                    <strong>Personalize AI Communications:</strong> Interaction
                    context is used by our drafting agents to generate relevant,
                    personalized SMS and email messages that align with
                    demonstrated interests.
                  </li>
                  <li>
                    <strong>Train Model Improvements:</strong> Aggregated,
                    de-identified behavioral data is used to improve AI model
                    accuracy, reduce hallucination rates, and optimize response
                    quality.
                  </li>
                </ul>
                <p className="mt-3">
                  You may opt out of Functional (AI Performance) cookies through
                  your browser settings or by contacting us at
                  privacy@referralsvc.com. Opting out may affect the
                  personalization and relevance of AI-generated communications
                  but will not prevent you from using core Platform features.
                </p>
              </section>

              {/* 5 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  5. Third-Party Cookies
                </h2>
                <p>
                  Our Platform may utilize cookies from the following third-party
                  services:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-1">
                  <li>
                    <strong>Cloudflare:</strong> Security, performance, and bot
                    detection cookies.
                  </li>
                  <li>
                    <strong>Railway:</strong> Deployment and health monitoring
                    cookies.
                  </li>
                  <li>
                    <strong>Twilio:</strong> SMS delivery tracking and
                    engagement cookies.
                  </li>
                </ul>
                <p className="mt-2">
                  We do not control third-party cookies and recommend reviewing
                  their respective privacy policies for details.
                </p>
              </section>

              {/* 6 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  6. Managing Cookies
                </h2>
                <p>
                  You can control and manage cookies through the following
                  methods:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-1">
                  <li>
                    <strong>Browser Settings:</strong> Most browsers allow you
                    to block, delete, or manage cookies through their settings
                    menu.
                  </li>
                  <li>
                    <strong>Opt-Out Request:</strong> Contact
                    privacy@referralsvc.com to opt out of non-essential cookies.
                  </li>
                  <li>
                    <strong>Do Not Track:</strong> We honor Do Not Track (DNT)
                    browser signals for analytics and marketing cookies. DNT
                    does not affect strictly necessary cookies.
                  </li>
                </ul>
                <p className="mt-2">
                  Note: Disabling cookies may impact Platform functionality,
                  including authenticated sessions and personalized AI
                  interactions.
                </p>
              </section>

              {/* 7 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  7. Updates to This Policy
                </h2>
                <p>
                  We may update this Cookie Policy to reflect changes in our
                  practices or applicable laws. Material changes will be posted
                  with an updated effective date. Continued use of the Platform
                  constitutes acceptance of the revised policy.
                </p>
              </section>

              {/* 8 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  8. Contact Us
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
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
