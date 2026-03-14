import { motion } from "framer-motion";
import { UserPlus, Wrench } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ---------------------------------------------------------------------------
// Phase 14: SP Onboarding — Module Placeholder
// Backend routes: POST /api/sp/onboard, GET /api/sp/ledger
// Status: Worker endpoint not yet provisioned. Renders static placeholder
//         to prevent JSON parse errors from HTML 404/Access Denied responses.
// ---------------------------------------------------------------------------

function ModulePlaceholder() {
  return (
    <motion.div
      variants={fadeUp}
      className="glass noise rounded-2xl p-8 border border-teal-500/20 text-center"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
        <Wrench size={28} className="text-teal-400/60" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">SP Onboarding</h3>
      <p className="text-white/40 text-sm max-w-md mx-auto mb-4">
        Deploy and monitor Sovereign Professional onboarding across Legal, Financial, and System gates.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-teal-400 text-xs font-semibold">Module in Development</span>
      </div>
      <p className="text-white/20 text-xs mt-4">
        Worker endpoints pending provisioning. Connect /api/sp/* routes to activate.
      </p>
    </motion.div>
  );
}

// Named Export — for CEO Dashboard tab embedding
export function SPOnboardingContent() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6 p-6"
    >
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <UserPlus size={18} className="text-teal-400" />
          </div>
          <h2 className="text-xl font-bold text-white">SP Onboarding</h2>
        </div>
        <p className="text-white/40 text-sm ml-11">
          Deploy and monitor Sovereign Professional onboarding — Legal, Financial, and System gates
        </p>
      </motion.div>

      <ModulePlaceholder />
    </motion.div>
  );
}

// Default Export — Standalone page
export default function SPOnboarding() {
  return (
    <div className="min-h-screen bg-[#0a0d14] p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <a href="/ceo" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60"><path d="m15 18-6-6 6-6"/></svg>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-white">SP Onboarding</h1>
              <p className="text-white/40 text-sm">Clawbot Autonomous Onboarding Engine</p>
            </div>
          </motion.div>

          <ModulePlaceholder />
        </motion.div>
      </div>
    </div>
  );
}
