import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Clock,
  Shield,
  Rocket,
  AlertTriangle,
  ChevronRight,
  Target,
  Users,
  Scale,
  TrendingUp,
  Bot,
  Crosshair,
  MessageSquare,
  DollarSign,
  Lock,
  Network,
  Zap,
  Award,
  Eye,
  FileCheck,
} from "lucide-react";
import CEONav from "../components/CEONav";

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------
const modules = [
  { id: "mindset", label: "Agentic Mindset", icon: Brain, color: "emerald" },
  { id: "bqm", label: "20-Min BQM", icon: Clock, color: "cyan" },
  { id: "trust", label: "Enterprise Trust", icon: Shield, color: "violet" },
  { id: "scaling", label: "Scaling the Pod", icon: Rocket, color: "amber" },
];

const pillColors = {
  emerald: { active: "bg-emerald-400/20 text-emerald-400 border-emerald-400/40", icon: "text-emerald-400" },
  cyan: { active: "bg-cyan-400/20 text-cyan-400 border-cyan-400/40", icon: "text-cyan-400" },
  violet: { active: "bg-violet-400/20 text-violet-400 border-violet-400/40", icon: "text-violet-400" },
  amber: { active: "bg-amber-400/20 text-amber-400 border-amber-400/40", icon: "text-amber-400" },
};

// ===========================================================================
// Table helper
// ===========================================================================
function DataTable({ headers, rows, accent = "accent" }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.02]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 ${
                    j === 0 ? "font-semibold text-white/80" : "text-white/50"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===========================================================================
// MODULE 1 — The Agentic Mindset Shift
// ===========================================================================
function ModuleMindset() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          From SDR to Deal Architect
        </h3>
        <p className="text-sm leading-relaxed text-white/60">
          The global commercial ecosystem is undergoing a paradigm shift more
          significant than the e-commerce revolution. Over 5.6 billion
          hyperconnected users are setting the stage for "Agentic Commerce"
          &mdash; intelligent AI agents capable of anticipating, personalizing,
          and automating every step of the commercial process. For elite
          Enterprise B2B professionals, this means a fundamental move from
          manual, volume-based prospecting to a high-leverage role as a Deal
          Architect. Within our ecosystem, the autonomous AI Triage Engine
          (Clawbot) handles 100% of top-of-funnel prospecting and lead
          qualification, allowing you to operate at the peak of your strategic
          capabilities.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          The Optimal Delegation Curve
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-white/60">
          The "agentic automation curve" illustrates how the buyer experience
          evolves at different levels of delegation. Understanding where you
          operate on this curve is essential for maximizing leverage.
        </p>
        <DataTable
          headers={["Level", "Description", "Your Role"]}
          rows={[
            [
              "Level 0: Programmed",
              "Rules-based, brittle, 'set and forget' subscriptions.",
              "Not applicable; handled by legacy systems.",
            ],
            [
              "Level 1: Assisted",
              "AI helps with search and comparison on owned sites.",
              "Monitoring intent signals for high-value breakout.",
            ],
            [
              "Level 2: Directed",
              "AI agents navigate APIs and loyalty programs.",
              "Validating the technical feasibility of the solution.",
            ],
            [
              "Level 3: Delegated",
              "Humans set goals; AI plans and executes within bounds.",
              "Structuring the Legal Moat and compliance terms.",
            ],
            [
              "Level 4: Orchestrated",
              "AI coordinates across multiple agents and platforms.",
              "Acting as the primary executive-level bridge.",
            ],
            [
              "Level 5: Autonomous",
              "Full goal-driven AI systems that plan, act, and learn.",
              "Sovereign oversight and long-term strategy design.",
            ],
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          The Psychology of the AI-Warmed Prospect
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-white/60">
          Research shows 86% of customers want the option to escalate to a
          human, and 63% will abandon after one poor chatbot experience. When
          the handoff works, satisfaction exceeds AI-only or human-only
          interactions. The prospect entering your meeting is not starting cold
          &mdash; they have already shared data, established goals, and
          demonstrated trust. Their psychological state is one of "informed
          urgency."
        </p>
        <DataTable
          headers={["Psychological Trigger", "AI Mechanism", "Your Response"]}
          rows={[
            [
              "Intent Formation",
              "Clawbot behavioral signals and query mapping.",
              "Acknowledge specific pain points identified.",
            ],
            [
              "Trust Erosion",
              "Endlessly looping bot or disconnected data.",
              "Seamlessly enter with full conversation context.",
            ],
            [
              "Status Assertion",
              "VIP fast-tracking to 'White-Glove' service.",
              "Position as a Sovereign Consultant, not a vendor.",
            ],
            [
              "Escalation Need",
              "Sentiment analysis detecting frustration.",
              "Provide 'Sovereign Judgment' and empathy.",
            ],
            [
              "Fear of Inaction",
              "AI-generated 'Opportunity Cost' metrics.",
              "Anchor value based on quantified business risk.",
            ],
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          Executing the Seamless Handoff
        </h3>
        <div className="glass noise rounded-xl p-5">
          <p className="mb-3 text-sm leading-relaxed text-white/60">
            The golden rule: <strong className="text-white">never make the
            prospect repeat themselves.</strong> Utilize the Full Context
            Briefings provided by Clawbot, which include: customer name, account
            information, initial query, full conversation transcript, and
            sentiment analysis.
          </p>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 mt-3">
            <p className="text-sm font-semibold text-accent mb-1">
              Template Opening:
            </p>
            <p className="text-sm text-white/60 italic">
              "Hi [Name], I've been reviewing your conversation with our team
              regarding [topic], and I see you're concerned about [specific
              pain]. Let's dive straight into how we solve that."
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            This approach validates the customer's prior effort and signals
            their time is valued. Enterprise B2B requires an 85+ intent
            confidence threshold before handoff. Your role is to catch the
            conversation the moment the system detects hesitation, repeated
            rephrasing, or emotional language &mdash; opening the exit door
            before they experience friction.
          </p>
        </div>
      </section>
    </div>
  );
}

// ===========================================================================
// MODULE 2 — Mastering the 20-Minute BQM
// ===========================================================================
function ModuleBQM() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          The Brief Qualifying Meeting
        </h3>
        <p className="text-sm leading-relaxed text-white/60">
          The BQM is the primary engine of bottom-of-funnel activity. Unlike
          hour-long discovery calls that devolve into generic pitches, the BQM
          is a highly structured, 20-minute engagement designed to diagnose
          pain, address objections preemptively, and co-create a solution. Your
          objective: control the "frame" of the conversation, anchor value not
          price, and remain willing to walk away from bad-fit deals.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          The BQM Anatomy
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-white/60">
          Success depends on strict adherence to a narrative sequence that
          respects the prospect's "crocodile brain" &mdash; the primitive part
          attracted to curiosity and novelty, but repelled by excessive detail.
        </p>
        <DataTable
          headers={["Segment", "Duration", "Objective", "Narrative Focus"]}
          rows={[
            [
              "Frame Setting",
              "3 min",
              "Assert authority and define the agenda.",
              "Peer-level evaluation of fit.",
            ],
            [
              "Discovery Validation",
              "5 min",
              "Confirm Clawbot data and explore the 'Why.'",
              "Deep diagnostic questions on pain.",
            ],
            [
              "The Future State",
              "5 min",
              "Contrast current pain with proposed solution.",
              "Whiteboarding the 'Desired Outcome.'",
            ],
            [
              "Value Anchoring",
              "4 min",
              "Quantify the cost of inaction and delay.",
              "Connecting problem to revenue plateau.",
            ],
            [
              "Prize Framing",
              "3 min",
              "Set terms for next step and qualify back.",
              "'Are you a fit for our ecosystem?'",
            ],
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          Frame Control Tactics
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass noise rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-white">
                Minutes 0&ndash;3: Frame Setting
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/50">
              Lead the discussion. If the prospect disrupts the frame (arriving
              late, rushing), use a strategic pause to reassert authority. You
              are the one in charge of the time frame.
            </p>
          </div>
          <div className="glass noise rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crosshair size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-white">
                Minutes 3&ndash;8: Discovery Validation
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/50">
              Use the prospect's own language from the Clawbot transcript.
              Mirror phrases like "drowning in operational details" to show
              genuine understanding.
            </p>
          </div>
          <div className="glass noise rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-white">
                Minutes 8&ndash;17: Future State + Anchoring
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/50">
              Move beyond selling to collaborative problem-solving. Ask: "What
              is this revenue plateau costing you monthly?" Convert time saved
              into cost of delay.
            </p>
          </div>
          <div className="glass noise rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-white">
                Minutes 17&ndash;20: Prize Framing
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/50">
              Flip the dynamic: "We only work with clients who have X, Y, Z."
              Make the prospect explain why they qualify for your ecosystem.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          Reading Clawbot's Intent Signals
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-white/60">
          The Full Context Briefing is your most powerful pre-call tool. Use
          these signals to shape the deal before the call even starts:
        </p>
        <DataTable
          headers={["Clawbot Signal", "Interpretation", "Your Tactic"]}
          rows={[
            [
              "Intent Score > 85",
              "High decision-grade readiness.",
              "Use the Prize Frame to test their fit.",
            ],
            [
              "Sentiment: Frustration",
              "Risk of churn or dissatisfaction.",
              "Lead with empathy; anchor on Cost of Inaction.",
            ],
            [
              "Repetitive Budget Queries",
              "Anxiety over ROI or financial risk.",
              "Quantify the cost of delay vs. investment.",
            ],
            [
              "Mentions of Competitors",
              "Potential 'Analyst Frame' trap.",
              "Reframe as 'Innovation Comparison.'",
            ],
            [
              "Quick Response Behavior",
              "High momentum and urgency.",
              "Use the Time Frame to accelerate closing.",
            ],
          ]}
        />
      </section>
    </div>
  );
}

// ===========================================================================
// MODULE 3 — Enterprise Trust & Compliance
// ===========================================================================
function ModuleTrust() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          The Shadow AI Problem
        </h3>
        <p className="text-sm leading-relaxed text-white/60">
          Shadow AI &mdash; unsanctioned use of AI systems without security
          review or data controls &mdash; creates an incentive mismatch:
          frontline teams prioritize speed while security teams fear data
          exfiltration, regulatory exposure, and hallucination-driven actions.
          Our platform's legal and security framework (the "Legal Moat") is not
          just a backend feature; it is a primary selling proposition for
          closing risk-averse enterprise clients.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          The Legal Moat
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-white/60">
          Our platform mitigates Shadow AI risks through a Zero-Trust framework.
          Every identity, data flow, and action is verified. Here is how to
          articulate each component to enterprise buyers:
        </p>
        <DataTable
          headers={["Component", "Technical Implementation", "Enterprise Benefit"]}
          rows={[
            [
              "Zero-Egress Security",
              "No replication; sharing via Cloudflare R2.",
              "Eliminates 'bandwidth tax' and exfiltration risk.",
            ],
            [
              "DocuSign Execution",
              "Integrated digital signing of multi-year contracts.",
              "Reduces friction; ensures legally binding intent.",
            ],
            [
              "Stripe FMV Retainers",
              "Payments based on Fair Market Value standards.",
              "IRS/Federal compliance and 'reasonableness.'",
            ],
            [
              "Identity Binding",
              "Every AI request bound to a specific SSO identity.",
              "Full audit logs for compliance review.",
            ],
            [
              "Output Guardrails",
              "Validators detecting PII, toxicity, hallucinations.",
              "Protects brand voice; prevents 'Rogue AI' actions.",
            ],
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          Handling Shadow AI Objections
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-white/60">
          Enterprise buyers are increasingly skeptical of automated outreach.
          Use these reframes to turn compliance from a barrier into your
          strongest closing tool:
        </p>
        <DataTable
          headers={["Objection", "Your Reframe", "Supporting Evidence"]}
          rows={[
            [
              "\"AI will leak our data.\"",
              "\"We use an AI access layer with PII filtering and zero-egress.\"",
              "900+ experimental bots found leaking API keys.",
            ],
            [
              "\"Automated calls are spam.\"",
              "\"Clawbot is identity-verified with DMARC/SPF/DKIM.\"",
              "Voice cloning used by scammers; we label all AI interactions.",
            ],
            [
              "\"We can't control what AI says.\"",
              "\"Brand-voice validators + human-in-the-loop approvals.\"",
              "30% of users switch after one bad bot interaction.",
            ],
            [
              "\"AI pricing is unpredictable.\"",
              "\"Consumption-based SaaS model with clear token spend.\"",
              "FinOps circuit breakers prevent runaway costs.",
            ],
            [
              "\"AI feels cold and robotic.\"",
              "\"AI handles mechanics; I handle nuance and empathy.\"",
              "68% of consumers prefer human agents for complex issues.",
            ],
          ]}
        />
      </section>

      <section>
        <div className="glass noise rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-violet-400" />
            <span className="text-sm font-bold text-white">
              Observability as a Selling Point
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            Every prompt, context source, model version, and output is captured
            and logged in our audit trail. This "full trace" capability is
            essential for healthcare, finance, and regulated industries where
            automated decision confidence thresholds must be significantly
            higher. Position this transparency as a safe-haven for enterprise
            data that justifies the premium.
          </p>
        </div>
      </section>
    </div>
  );
}

// ===========================================================================
// MODULE 4 — Scaling the Sovereign Pod
// ===========================================================================
function ModuleScaling() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          From Deal Architect to Fractional CRO
        </h3>
        <p className="text-sm leading-relaxed text-white/60">
          You are not merely a salesperson &mdash; you are an entrepreneur
          building a "Pod" on the platform's infrastructure. A Pod is a
          self-sustaining sales unit that leverages the "Right to Substitute" to
          scale without increasing your personal workload. By operating as a
          Fractional CRO, you manage a multi-million dollar pipeline by focusing
          on high-level strategy while delegating BQM execution to qualified
          sub-contractors.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          The Revenue Scaling Formula
        </h3>
        <div className="glass noise rounded-xl p-6">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">
              Pod Revenue Model
            </p>
            <div className="inline-block rounded-xl border border-amber-400/30 bg-amber-400/10 px-6 py-4">
              <p className="text-lg font-bold text-white">
                Total Revenue ={" "}
                <span className="text-amber-400">
                  &Sigma;(Contract Value &times; Close Rate)
                </span>
              </p>
              <p className="text-lg font-bold text-white">
                &minus;{" "}
                <span className="text-white/60">
                  (Subcontractor Costs + Platform Fees)
                </span>
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center">
              <p className="text-xs text-white/40 mb-1">Contract Value</p>
              <p className="text-lg font-bold text-white">$50K &ndash; $150K</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center">
              <p className="text-xs text-white/40 mb-1">Close Rate (85+ intent)</p>
              <p className="text-lg font-bold text-emerald-400">Optimized</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center">
              <p className="text-xs text-white/40 mb-1">Sub Costs</p>
              <p className="text-lg font-bold text-white">Your 1099 terms</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          Exercising the Right to Substitute
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-white/60">
          The Right to Substitute is the cornerstone of your 1099 status and
          your ability to scale. Under IRS common law rules, independent
          contractors have the right to substitute other people's services for
          their own. Here's how the classification factors break down:
        </p>
        <DataTable
          headers={["Factor", "Sovereign Professional (1099)", "Traditional SDR (W-2)"]}
          rows={[
            [
              "Right to Substitute",
              "Can hire sub-contractors to do the work.",
              "Must perform services personally.",
            ],
            [
              "Control of Process",
              "Focus on results; decides 'how' work is done.",
              "Must follow step-by-step instructions.",
            ],
            [
              "Hours & Schedule",
              "Sets own hours based on project needs.",
              "Required to work set full-time hours.",
            ],
            [
              "Economic Risk",
              "Can experience a profit or a loss.",
              "Generally paid a steady wage.",
            ],
            [
              "Integration",
              "Services are distinct from primary business.",
              "Services are core to daily operations.",
            ],
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold text-white">
          Marketing Your Pod
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-white/60">
          To scale, transition from outbound "hunting" to inbound "attraction."
          A successful Fractional CRO marketing strategy includes:
        </p>
        <DataTable
          headers={["Channel", "Tactic", "Strategic Goal"]}
          rows={[
            [
              "LinkedIn / Content",
              "Publish case studies on 'Agentic ROI.'",
              "Establish Prize Frame authority.",
            ],
            [
              "Webinars",
              "Host sessions on AI compliance and GTM.",
              "Generate 'White-Glove' inbound leads.",
            ],
            [
              "Partner Ecosystems",
              "Collaborate with Fractional CFOs/CTOs.",
              "Create high-value referral loops.",
            ],
            [
              "Direct Outreach",
              "VIP high-impact tactics like 'BigBoards.'",
              "Secure meetings with C-Suite.",
            ],
            [
              "Playbooks / Lead Magnets",
              "Offer 'Gap Analysis' assessments.",
              "Identify the client's $100K+ pain points.",
            ],
          ]}
        />
      </section>

      <section>
        <div className="glass noise rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Network size={16} className="text-amber-400" />
            <span className="text-sm font-bold text-white">
              Managing the Pod as a Fractional CRO
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            Your role shifts from "doing the work" to "designing the system."
            Bridge strategic growth with hands-on execution across sales,
            marketing, and operations. Calculate CAC Payback and Cost of Revenue
            for your entire Pod to ensure profitability. Act as a feasibility
            checkpoint &mdash; ensuring solutions being sold can be delivered
            post-sale. Maintain executive presence and build a predictable
            revenue engine that makes growth sustainable.
          </p>
        </div>
      </section>
    </div>
  );
}

// ===========================================================================
// Main Component
// ===========================================================================
export default function Playbook() {
  const [activeModule, setActiveModule] = useState("mindset");

  const moduleComponents = {
    mindset: ModuleMindset,
    bqm: ModuleBQM,
    trust: ModuleTrust,
    scaling: ModuleScaling,
  };

  const ActiveComponent = moduleComponents[activeModule];
  const activeMeta = modules.find((m) => m.id === activeModule);

  return (
    <div className="relative min-h-screen">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* CEO Tab Nav */}
      <CEONav />

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Header */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <FileCheck size={20} className="text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold md:text-3xl">
                  Sovereign{" "}
                  <span className="gradient-text">Playbook</span>
                </h1>
                <p className="text-sm text-white/40">
                  Deal Architect Training &amp; Agentic Commerce Framework
                </p>
              </div>
            </div>
          </motion.div>

          {/* 1099 Disclaimer */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0 text-amber-400"
              />
              <p className="text-xs leading-relaxed text-amber-400/80">
                This playbook is an optional resource provided for your success.
                As an independent Sovereign Professional, you maintain total
                autonomy over your methods and schedule. Nothing herein
                constitutes an employer directive or mandatory training
                requirement.
              </p>
            </div>
          </motion.div>

          {/* Module pills */}
          <motion.div
            variants={fadeUp}
            className="mb-8 flex flex-wrap gap-2"
          >
            {modules.map((m) => {
              const isActive = activeModule === m.id;
              const colors = pillColors[m.color];
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? colors.active
                      : "border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  <m.icon
                    size={15}
                    className={isActive ? colors.icon : "text-white/30"}
                  />
                  {m.label}
                </button>
              );
            })}
          </motion.div>

          {/* Module header badge */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Module{" "}
                {modules.findIndex((m) => m.id === activeModule) + 1} of 4
              </span>
              <ChevronRight size={12} className="text-white/20" />
              <span className="text-xs text-white/40">
                {activeMeta?.label}
              </span>
            </div>
          </motion.div>

          {/* Active module content */}
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
