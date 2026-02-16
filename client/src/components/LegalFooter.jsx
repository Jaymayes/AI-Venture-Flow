import { Link } from "wouter";
import {
  Shield,
  Scale,
  Cookie,
  AlertTriangle,
  Eye,
  Zap,
  Bot,
} from "lucide-react";

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms of Use", icon: Scale },
  { href: "/cookies", label: "Cookie Policy", icon: Cookie },
  { href: "/disclaimer", label: "Disclaimer", icon: AlertTriangle },
  { href: "/accessibility", label: "Accessibility", icon: Eye },
];

const siteLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recruit", label: "Hiring" },
  { href: "/outreach", label: "Outreach" },
  { href: "/bqm", label: "BQM" },
];

const protectedLinks = [
  { href: "/ceo", label: "CEO Dashboard", color: "text-emerald-400/70 hover:text-emerald-400" },
  { href: "/briefings", label: "Briefings", color: "text-cyan-400/70 hover:text-cyan-400" },
];

export default function LegalFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08]">
      {/* ── Main footer area ── */}
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-white transition hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/30">
                <Bot size={16} className="text-accent" />
              </div>
              Referral&nbsp;Service
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
              AI Digital Employees for modern ventures. Deploy autonomous
              workforce modules in days, not months.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40">
              <Zap size={10} className="text-accent" />
              AI-Human Hybrid Venture Studio
            </div>
          </div>

          {/* Platform column */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {siteLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {protectedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition ${link.color}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
                  >
                    <link.icon
                      size={12}
                      className="text-white/20 transition group-hover:text-accent/60"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-white/40">
              <li>legal@referralsvc.com</li>
              <li>privacy@referralsvc.com</li>
              <li>Phoenix, AZ</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 md:flex-row">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} Referral Service LLC. All rights
            reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {legalLinks.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/20 transition hover:text-white/50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
