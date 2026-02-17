import { Link, useLocation } from "wouter";
import {
  Activity,
  FileText,
  Users,
  BookOpen,
  ArrowLeft,
  Lock,
} from "lucide-react";

const tabs = [
  { href: "/ceo", label: "CEO Dashboard", icon: Activity, color: "emerald" },
  { href: "/briefings", label: "Lead Briefings", icon: FileText, color: "cyan" },
  { href: "/recruiting-ops", label: "Recruitment Ops", icon: Users, color: "violet" },
  { href: "/playbook", label: "Sovereign Playbook", icon: BookOpen, color: "amber" },
];

const colorMap = {
  emerald: {
    active: "border-emerald-400 text-emerald-400 bg-emerald-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-emerald-400",
  },
  cyan: {
    active: "border-cyan-400 text-cyan-400 bg-cyan-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-cyan-400",
  },
  violet: {
    active: "border-violet-400 text-violet-400 bg-violet-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-violet-400",
  },
  amber: {
    active: "border-amber-400 text-amber-400 bg-amber-400/10",
    idle: "border-transparent text-white/40 hover:text-white/70 hover:border-white/10",
    icon: "text-amber-400",
  },
};

export default function CEONav() {
  const [location] = useLocation();

  return (
    <div className="glass noise sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6">
        {/* Top bar with back link + lock badge */}
        <div className="flex items-center justify-between py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/30">
            <Lock size={10} />
            Executive Access
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
          {tabs.map((tab) => {
            const isActive = location === tab.href;
            const colors = colorMap[tab.color];
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  isActive ? colors.active : colors.idle
                }`}
              >
                <tab.icon size={15} className={isActive ? colors.icon : "text-white/30"} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
