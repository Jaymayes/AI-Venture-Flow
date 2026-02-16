import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert } from "lucide-react";

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

export default function AcceptableUse() {
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
          {/* Header */}
          <motion.div variants={fadeUp} className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <ShieldAlert size={20} className="text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Legal
              </span>
            </div>
            <h1 className="gradient-text mb-3 text-4xl font-extrabold md:text-5xl">
              Acceptable Use Policy
            </h1>
            <p className="text-sm text-white/40">
              Effective Date: January 1, 2025 &middot; Last Updated: February
              2026
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
                  1. Purpose and Scope
                </h2>
                <p>
                  This Acceptable Use Policy ("AUP") governs the use of all
                  services, infrastructure, AI agents, communications channels,
                  and platform features provided by Referral Service LLC
                  ("Company," "we," "us," or "our") through the referralsvc.com
                  platform (the "Platform"). This AUP applies to all users,
                  including but not limited to clients, Sovereign Professionals
                  (independent contractors), API consumers, and any individual or
                  entity accessing or utilizing the Platform's outbound
                  communications infrastructure, AI systems, or data pipelines.
                </p>
                <p className="mt-3">
                  This AUP supplements our{" "}
                  <Link href="/terms" className="text-accent hover:underline">
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-accent hover:underline">
                    Privacy Policy
                  </Link>
                  . In the event of a conflict, the more restrictive provision
                  shall control. Violation of this AUP constitutes a material
                  breach of your agreement with the Company and may result in
                  immediate termination as described in Section 7.
                </p>
              </section>

              {/* 2 — Prohibited Communications */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  2. Prohibited Communications
                </h2>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="mb-3 font-semibold text-red-400">
                    Zero-Tolerance Policy
                  </p>
                  <p className="mb-4">
                    The Platform's outbound communications infrastructure,
                    including Twilio SMS and Resend email integrations, is
                    provided exclusively for lawful, consent-based business
                    communications. The following activities are strictly
                    prohibited:
                  </p>

                  <p className="font-semibold text-white/90 mb-2">
                    2.1 Spam and Unsolicited Messaging
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Sending unsolicited bulk SMS or email messages to
                      recipients who have not provided prior express written
                      consent.
                    </li>
                    <li>
                      Transmitting commercial messages to purchased, scraped,
                      harvested, or rented contact lists that lack verifiable
                      opt-in consent records.
                    </li>
                    <li>
                      Sending messages with false, misleading, or forged sender
                      identification, headers, or routing information.
                    </li>
                    <li>
                      Using the Platform to transmit chain messages, pyramid
                      schemes, or multi-level marketing solicitations.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    2.2 TCPA Compliance
                  </p>
                  <p className="mb-3">
                    All SMS and voice communications initiated through the
                    Platform must comply with the Telephone Consumer Protection
                    Act (TCPA), 47 U.S.C. &sect; 227, including but not limited
                    to:
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Obtaining prior express written consent before sending
                      marketing or promotional messages via SMS or automated
                      calling systems.
                    </li>
                    <li>
                      Honoring all opt-out requests (STOP replies) within 24
                      hours and maintaining a suppression list.
                    </li>
                    <li>
                      Including clear sender identification and opt-out
                      instructions in every marketing message.
                    </li>
                    <li>
                      Restricting message transmission to permissible hours as
                      defined by federal and applicable state regulations.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    2.3 CAN-SPAM Act Compliance
                  </p>
                  <p className="mb-3">
                    All email communications sent through the Platform's Resend
                    integration must comply with the CAN-SPAM Act (15 U.S.C.
                    &sect; 7701 et seq.), including:
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Including a valid physical mailing address of the sender
                      in every commercial email.
                    </li>
                    <li>
                      Providing a clear, conspicuous, and functional
                      unsubscribe mechanism in every commercial email.
                    </li>
                    <li>
                      Processing unsubscribe requests within ten (10) business
                      days.
                    </li>
                    <li>
                      Using accurate, non-deceptive subject lines and header
                      information.
                    </li>
                    <li>
                      Clearly identifying the message as an advertisement where
                      required.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    2.4 CTIA Messaging Guidelines
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      All SMS campaigns must comply with the CTIA Messaging
                      Principles and Best Practices, including proper campaign
                      registration and content standards.
                    </li>
                    <li>
                      Messages must not contain prohibited content categories as
                      defined by CTIA, including but not limited to: SHAFT
                      content (sex, hate, alcohol, firearms, tobacco) in
                      standard-rate SMS campaigns.
                    </li>
                    <li>
                      Message throughput must not exceed carrier-imposed rate
                      limits or attempt to circumvent carrier filtering
                      mechanisms.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    2.5 Phishing and Fraudulent Communications
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5">
                    <li>
                      Using the Platform to send phishing messages, pretexting
                      communications, or social engineering attacks.
                    </li>
                    <li>
                      Impersonating any person, business, government entity, or
                      organization in outbound communications.
                    </li>
                    <li>
                      Soliciting sensitive personal information (passwords,
                      Social Security numbers, financial credentials) via
                      Platform communications channels.
                    </li>
                    <li>
                      Transmitting malware, malicious links, or deceptive URLs
                      through SMS or email.
                    </li>
                  </ul>
                </div>
              </section>

              {/* 3 — AI & Infrastructure Abuse */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  3. AI and Infrastructure Abuse
                </h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="mb-4">
                    The Platform's AI systems, including the Clawbot autonomous
                    SDR agent, Triage Engine, orchestration pipeline, and
                    associated infrastructure, are proprietary technologies
                    protected by trade secret and intellectual property law. The
                    following activities constitute infrastructure abuse and are
                    strictly prohibited:
                  </p>

                  <p className="font-semibold text-white/90 mb-2">
                    3.1 Prompt Injection and Model Manipulation
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Crafting, submitting, or injecting adversarial inputs
                      designed to manipulate, override, bypass, or alter the
                      behavior of Clawbot, the Triage Engine, or any AI model
                      operating within the Platform (commonly known as "prompt
                      injection" attacks).
                    </li>
                    <li>
                      Attempting to extract system prompts, internal
                      instructions, model weights, training data, or
                      proprietary configuration from any AI component.
                    </li>
                    <li>
                      Submitting inputs designed to cause the AI to generate
                      content that violates this AUP, applicable law, or the
                      rights of third parties.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    3.2 Reverse Engineering
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Reverse-engineering, decompiling, disassembling, or
                      otherwise attempting to derive the source code, logic,
                      algorithms, or architecture of the Clawbot Triage Engine,
                      intent scoring models, orchestration pipeline, or any
                      other proprietary Platform component.
                    </li>
                    <li>
                      Systematically probing API endpoints, service bindings, or
                      Worker-to-Worker communication channels to map internal
                      infrastructure topology.
                    </li>
                    <li>
                      Conducting automated or manual security scanning,
                      penetration testing, or vulnerability assessment against
                      Platform infrastructure without prior written
                      authorization.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    3.3 FinOps Circuit Breaker Bypass
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Attempting to bypass, circumvent, disable, or interfere
                      with the Platform's FinOps TPM (Tokens Per Minute) circuit
                      breakers, rate limiters, or cost-control mechanisms.
                    </li>
                    <li>
                      Generating excessive API calls, queue messages, or AI
                      inference requests designed to exhaust Platform resources,
                      inflate costs, or trigger denial-of-service conditions.
                    </li>
                    <li>
                      Manipulating telemetry data, cost metrics, or usage
                      reporting to misrepresent actual resource consumption.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    3.4 Prohibited AI-Generated Content
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5">
                    <li>
                      Using the Platform's AI systems to generate content that
                      is discriminatory based on race, color, religion, sex,
                      national origin, age, disability, genetic information,
                      sexual orientation, or gender identity.
                    </li>
                    <li>
                      Directing AI agents to produce threatening, harassing,
                      defamatory, obscene, or otherwise illegal content.
                    </li>
                    <li>
                      Using AI-generated communications to facilitate fraud,
                      deception, money laundering, or any criminal activity.
                    </li>
                    <li>
                      Generating deepfake content, synthetic media, or
                      AI-fabricated testimonials intended to deceive recipients.
                    </li>
                  </ul>
                </div>
              </section>

              {/* 4 — Sovereign Professional Rules */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  4. Sovereign Professional Obligations
                </h2>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <p className="mb-4">
                    Sovereign Professionals (1099 independent contractors)
                    operating on the Platform bear heightened responsibilities
                    regarding data integrity and communications compliance.
                    Sovereign Professionals must adhere to the following
                    requirements in addition to all other provisions of this
                    AUP:
                  </p>

                  <p className="font-semibold text-white/90 mb-2">
                    4.1 List Ingestion and Consent Verification
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Any contact list, lead list, prospect database, or
                      customer data uploaded, imported, or ingested into the
                      Platform by a Sovereign Professional must contain only
                      contacts for whom <strong>verifiable, documented opt-in
                      consent</strong> has been obtained.
                    </li>
                    <li>
                      Sovereign Professionals must maintain records of consent
                      (including date, time, method, and scope of consent) for
                      each contact and must produce such records upon request by
                      the Company within five (5) business days.
                    </li>
                    <li>
                      Lists sourced from third-party data brokers, lead
                      aggregators, or data resellers must be accompanied by
                      written certification from the source confirming
                      TCPA-compliant consent for each contact.
                    </li>
                    <li>
                      The Company reserves the right to audit, quarantine, or
                      reject any ingested list that lacks sufficient consent
                      documentation.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    4.2 Content Responsibility
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Sovereign Professionals are solely responsible for the
                      accuracy, legality, and appropriateness of any custom
                      content, templates, or instructions they provide to the
                      Platform's AI systems for outbound communications.
                    </li>
                    <li>
                      Custom outreach campaigns created by Sovereign
                      Professionals must comply with all applicable federal,
                      state, and local regulations, including industry-specific
                      advertising and solicitation rules.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    4.3 Indemnification
                  </p>
                  <p>
                    Sovereign Professionals agree to indemnify, defend, and hold
                    harmless the Company from and against any and all claims,
                    damages, fines, penalties, and expenses (including reasonable
                    attorneys' fees) arising from or related to the Sovereign
                    Professional's violation of this AUP, including but not
                    limited to TCPA violations, CAN-SPAM violations, or the use
                    of non-consented contact data.
                  </p>
                </div>
              </section>

              {/* 5 — Data & Security */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  5. Data and Security Restrictions
                </h2>
                <ul className="ml-4 list-disc space-y-2">
                  <li>
                    Users must not upload, transmit, or store malware, viruses,
                    ransomware, or any malicious code on the Platform.
                  </li>
                  <li>
                    Users must not attempt unauthorized access to Platform
                    systems, accounts, data stores (including Cloudflare KV, R2,
                    and Vectorize), or internal service bindings.
                  </li>
                  <li>
                    Users must not intercept, monitor, or tamper with
                    communications between Platform components, including
                    Worker-to-Worker service bindings, Queue consumers, or
                    webhook endpoints.
                  </li>
                  <li>
                    Users must not share authentication credentials (including
                    CEO PIN, service tokens, or API keys) with unauthorized
                    parties or use another user's credentials.
                  </li>
                  <li>
                    Users must not circumvent or disable authentication
                    mechanisms, including the AuthGate, Cloudflare Access, or
                    service token validation.
                  </li>
                </ul>
              </section>

              {/* 6 — Monitoring & Reporting */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  6. Monitoring and Reporting
                </h2>
                <p>
                  The Company monitors Platform usage for compliance with this
                  AUP. Monitoring mechanisms include but are not limited to:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-1.5">
                  <li>
                    FinOps telemetry tracking of API consumption, token usage,
                    and cost metrics.
                  </li>
                  <li>
                    Automated review of outbound message content and delivery
                    patterns for spam signals and compliance indicators.
                  </li>
                  <li>
                    Queue consumer logs, delivery receipts, and bounce/complaint
                    rate analysis.
                  </li>
                  <li>
                    Periodic audits of Sovereign Professional list quality and
                    consent documentation.
                  </li>
                </ul>
                <p className="mt-3">
                  If you become aware of any violation of this AUP by any user,
                  you are encouraged to report it to{" "}
                  <span className="text-white/80">abuse@referralsvc.com</span>.
                  Reports may be submitted anonymously.
                </p>
              </section>

              {/* 7 — Enforcement & Termination */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  7. Enforcement and Termination
                </h2>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="mb-3 font-semibold text-red-400">
                    Immediate Suspension and Termination Rights
                  </p>
                  <p className="mb-4">
                    Referral Service LLC reserves the right, in its sole and
                    absolute discretion, to take any or all of the following
                    actions in response to a violation or suspected violation of
                    this AUP:
                  </p>

                  <p className="font-semibold text-white/90 mb-2">
                    7.1 Immediate Actions
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      <strong>Immediate suspension</strong> of Platform access,
                      including all API endpoints, dashboard access,
                      communications channels, and AI agent services, without
                      prior notice.
                    </li>
                    <li>
                      <strong>Immediate termination</strong> of the user's
                      account, service agreement, and all associated privileges
                      without prior notice.
                    </li>
                    <li>
                      <strong>Quarantine or deletion</strong> of content,
                      contact lists, campaigns, or data associated with the
                      violation.
                    </li>
                    <li>
                      <strong>Blocking</strong> of outbound communications
                      (SMS and email) associated with the violating account.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    7.2 No Refund
                  </p>
                  <p className="mb-4">
                    IN THE EVENT OF SUSPENSION OR TERMINATION FOR VIOLATION OF
                    THIS AUP, THE USER SHALL NOT BE ENTITLED TO ANY REFUND OF
                    FEES PAID, WHETHER PRORATED OR OTHERWISE. ALL PREPAID FEES,
                    HIRING FEES, AND AI SALARY PAYMENTS ARE NON-REFUNDABLE UPON
                    TERMINATION FOR CAUSE.
                  </p>

                  <p className="font-semibold text-white/90 mb-2">
                    7.3 Additional Remedies
                  </p>
                  <p className="mb-3">
                    The Company may pursue any and all additional remedies
                    available at law or in equity, including but not limited to:
                  </p>
                  <ul className="ml-4 list-disc space-y-1.5 mb-4">
                    <li>
                      Referral to appropriate law enforcement or regulatory
                      authorities.
                    </li>
                    <li>
                      Civil action for damages, including consequential damages
                      caused by the violation.
                    </li>
                    <li>
                      Recovery of costs incurred due to the violation,
                      including carrier fines, Twilio/Resend penalties,
                      infrastructure remediation costs, and legal fees.
                    </li>
                    <li>
                      Reporting the violation to Twilio, Resend, Cloudflare,
                      or other service providers, which may result in
                      independent action by those providers.
                    </li>
                  </ul>

                  <p className="font-semibold text-white/90 mb-2">
                    7.4 Investigation Rights
                  </p>
                  <p>
                    The Company reserves the right to investigate any suspected
                    violation of this AUP. During an investigation, the Company
                    may suspend access to the Platform, preserve evidence,
                    review communications logs and queue records, and cooperate
                    with law enforcement or regulatory authorities as required or
                    deemed appropriate.
                  </p>
                </div>
              </section>

              {/* 8 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  8. Modifications
                </h2>
                <p>
                  The Company reserves the right to modify this AUP at any time.
                  Material changes will be posted on this page with an updated
                  effective date. Continued use of the Platform after any
                  modification constitutes acceptance of the revised AUP. It is
                  your responsibility to review this AUP periodically.
                </p>
              </section>

              {/* 9 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  9. Severability
                </h2>
                <p>
                  If any provision of this AUP is found to be invalid,
                  unenforceable, or illegal by a court of competent
                  jurisdiction, the remaining provisions shall continue in full
                  force and effect. The invalid provision shall be modified to
                  the minimum extent necessary to make it valid and enforceable
                  while preserving its original intent.
                </p>
              </section>

              {/* 10 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  10. Governing Law
                </h2>
                <p>
                  This AUP shall be governed by and construed in accordance with
                  the laws of the State of Arizona, without regard to its
                  conflict of law provisions. Any dispute arising under this AUP
                  shall be subject to the dispute resolution procedures set
                  forth in our{" "}
                  <Link href="/terms" className="text-accent hover:underline">
                    Terms of Use
                  </Link>
                  .
                </p>
              </section>

              {/* 11 */}
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">
                  11. Contact and Abuse Reporting
                </h2>
                <p>
                  To report a violation of this AUP, or for questions regarding
                  acceptable use:
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  <p className="font-semibold">Referral Service LLC</p>
                  <p>Attn: Compliance &amp; Abuse Team</p>
                  <p>Email: abuse@referralsvc.com</p>
                  <p>Legal: legal@referralsvc.com</p>
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
