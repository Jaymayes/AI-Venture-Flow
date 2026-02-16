import { Link } from "wouter";
import { Shield, Scale, Cookie, AlertTriangle, Eye } from "lucide-react";

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms of Use", icon: Scale },
  { href: "/cookies", label: "Cookie Policy", icon: Cookie },
  { href: "/disclaimer", label: "Disclaimer", icon: AlertTriangle },
  { href: "/accessibility", label: "Accessibility", icon: Eye },
];

export default function LegalFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-[#0b0e18]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Legal links row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/70"
            >
              <link.icon
                size={12}
                className="text-white/20 transition group-hover:text-accent/60"
              />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Bottom row */}
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} Referral Service LLC. All rights
            reserved.
          </p>
          <p className="text-xs text-white/20">
            AI-Human Hybrid Venture Studio &middot; Phoenix, AZ
          </p>
        </div>
      </div>
    </footer>
  );
}
