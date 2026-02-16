import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Eye } from "lucide-react";

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

export default function Accessibility() {
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
                <Eye size={20} className="text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Legal
              </span>
            </div>
            <h1 className="gradient-text mb-3 text-4xl font-extrabold md:text-5xl">
              Accessibility Statement
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
                  1. Our Commitment
                </h2>
                <p>
                  Referral Service LLC is committed to ensuring digital
                  accessibility for all users, including people with
                  disabilities. We continually work to improve the user
                  experience on our Platform (referralsvc.com) and ensure that
                  our AI-Human Hybrid venture studio services are accessible to
                  the widest possible audience, regardless of technology or
                  ability.
                </p>
              </section>

              {/* 2 — WCAG */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  2. Conformance Standard
                </h2>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <p className="font-semibold text-accent mb-3">
                    WCAG 2.1 Level AA
                  </p>
                  <p>
                    We aim to conform to the{" "}
                    <strong>
                      Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
                    </strong>{" "}
                    standards as published by the World Wide Web Consortium
                    (W3C). These guidelines explain how to make web content more
                    accessible to people with a wide range of disabilities,
                    including visual, auditory, physical, speech, cognitive, and
                    neurological disabilities.
                  </p>
                  <p className="mt-3">
                    Conformance with WCAG 2.1 Level AA means our Platform strives
                    to meet the following core principles:
                  </p>
                  <ul className="ml-4 mt-2 list-disc space-y-2">
                    <li>
                      <strong>Perceivable:</strong> Information and user
                      interface components are presented in ways that users can
                      perceive, including text alternatives for non-text content,
                      captions for multimedia, and sufficient color contrast.
                    </li>
                    <li>
                      <strong>Operable:</strong> User interface components and
                      navigation are operable via keyboard, provide sufficient
                      time for interaction, and do not contain content that
                      causes seizures or physical reactions.
                    </li>
                    <li>
                      <strong>Understandable:</strong> Information and interface
                      operation are understandable, with readable text,
                      predictable navigation, and input assistance for error
                      prevention and correction.
                    </li>
                    <li>
                      <strong>Robust:</strong> Content is robust enough to be
                      interpreted reliably by a wide variety of user agents,
                      including assistive technologies such as screen readers.
                    </li>
                  </ul>
                </div>
              </section>

              {/* 3 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  3. Measures Taken
                </h2>
                <p>
                  We have taken the following measures to ensure accessibility on
                  our Platform:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-2">
                  <li>
                    <strong>Semantic HTML:</strong> We use proper semantic
                    elements (headings, landmarks, lists, buttons) to ensure
                    screen readers and assistive technologies can accurately
                    interpret page structure and content.
                  </li>
                  <li>
                    <strong>Keyboard Navigation:</strong> All interactive
                    elements including navigation menus, buttons, forms, and
                    authentication gates are accessible via keyboard input
                    without requiring a mouse.
                  </li>
                  <li>
                    <strong>Color Contrast:</strong> We maintain a minimum
                    contrast ratio of 4.5:1 for normal text and 3:1 for large
                    text, consistent with WCAG 2.1 Level AA requirements.
                  </li>
                  <li>
                    <strong>Focus Indicators:</strong> Visible focus indicators
                    are provided for all interactive elements to assist keyboard
                    users in tracking their position on the page.
                  </li>
                  <li>
                    <strong>Responsive Design:</strong> The Platform is designed
                    to be responsive and functional across devices, screen
                    sizes, and orientations, including support for text resizing
                    up to 200% without loss of content or functionality.
                  </li>
                  <li>
                    <strong>Motion Sensitivity:</strong> Animations on our
                    Platform respect the "prefers-reduced-motion" media query,
                    reducing or disabling animations for users who have indicated
                    a preference for reduced motion in their operating system
                    settings.
                  </li>
                  <li>
                    <strong>Form Labels:</strong> All form inputs, including
                    the CEO authentication gate, include associated labels and
                    instructions for screen reader compatibility.
                  </li>
                </ul>
              </section>

              {/* 4 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  4. AI Accessibility Considerations
                </h2>
                <p>
                  As an AI-Human Hybrid platform, we recognize unique
                  accessibility considerations related to our AI-powered
                  services:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-2">
                  <li>
                    <strong>AI-Generated Communications:</strong> SMS and email
                    messages generated by our AI agents (including Clawbot) are
                    composed in plain, clear language to ensure readability and
                    comprehension across accessibility needs.
                  </li>
                  <li>
                    <strong>Dashboard Visualizations:</strong> CEO Dashboard
                    metrics, FinOps telemetry, and pipeline visualizations
                    include text-based data representations accessible to screen
                    readers in addition to visual charts and indicators.
                  </li>
                  <li>
                    <strong>Automated Decision Transparency:</strong> AI
                    scoring outputs and classification decisions are
                    communicated in accessible, human-readable formats with
                    clear explanations.
                  </li>
                </ul>
              </section>

              {/* 5 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  5. Known Limitations
                </h2>
                <p>
                  While we strive for comprehensive accessibility, we
                  acknowledge that some areas may not yet be fully conformant:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-1">
                  <li>
                    Third-party integrations (Twilio widget, embedded analytics)
                    may have accessibility limitations outside our direct
                    control.
                  </li>
                  <li>
                    Some complex data visualizations may have limited screen
                    reader support. We are actively working to add ARIA labels
                    and text alternatives.
                  </li>
                  <li>
                    PDF documents or downloadable resources may not yet be
                    fully accessible. We are working to provide accessible
                    alternatives.
                  </li>
                </ul>
              </section>

              {/* 6 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  6. Compatibility
                </h2>
                <p>
                  Our Platform is designed to be compatible with the following
                  assistive technologies:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-1">
                  <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
                  <li>Screen magnification software</li>
                  <li>Speech recognition software</li>
                  <li>Keyboard-only navigation</li>
                </ul>
                <p className="mt-2">
                  The Platform is best experienced in the latest versions of
                  Chrome, Firefox, Safari, and Edge browsers.
                </p>
              </section>

              {/* 7 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  7. Feedback and Reporting Barriers
                </h2>
                <p>
                  We welcome your feedback on the accessibility of our Platform.
                  If you encounter accessibility barriers or have suggestions
                  for improvement, please contact us:
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  <p className="font-semibold">Referral Service LLC</p>
                  <p>Attn: Accessibility Coordinator</p>
                  <p>Email: accessibility@referralsvc.com</p>
                  <p>Website: referralsvc.com</p>
                </div>
                <p className="mt-3">
                  We aim to respond to accessibility feedback within five (5)
                  business days and to resolve reported barriers within thirty
                  (30) business days where feasible.
                </p>
              </section>

              {/* 8 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  8. Continuous Improvement
                </h2>
                <p>
                  Accessibility is an ongoing effort. We conduct periodic
                  accessibility audits, incorporate accessibility into our
                  development process, and train team members on accessible
                  design and development practices. This statement is reviewed
                  and updated at least annually to reflect our current
                  accessibility status and improvements.
                </p>
              </section>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
