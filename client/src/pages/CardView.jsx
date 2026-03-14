import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  Download,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  Handshake,
  Send,
  X,
  CheckCircle2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import VideoAvatar from "../components/VideoAvatar";
import QRModal from "../components/QRModal";
import CardChat from "../components/CardChat";

const API_BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";
const SITE_URL = "https://referralsvc.com";

// ── Social platform icons & colors ─────────────────────────────────
const SOCIAL_CONFIG = {
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  twitter: {
    label: "X",
    color: "#000000",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  github: {
    label: "GitHub",
    color: "#333",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  instagram: {
    label: "Instagram",
    color: "#E4405F",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" />
      </svg>
    ),
  },
};

function getSocialConfig(platform) {
  const key = platform?.toLowerCase().replace(/\s+/g, "");
  return SOCIAL_CONFIG[key] || {
    label: platform,
    color: "#6d5cff",
    icon: () => <ExternalLink size={20} />,
  };
}

// ── Stagger animation variants ─────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } },
};

// ═══════════════════════════════════════════════════════════════════════
// CardView — Main Page Component
// ═══════════════════════════════════════════════════════════════════════

export default function CardView() {
  const params = useParams();
  const slug = params.slug;
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phase 39: Lead capture
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(null);
  const [leadError, setLeadError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/v1/cards/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Card not found" : `Error ${res.status}`);
        return res.json();
      })
      .then((data) => setCard(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Phase 39: Lead submission handler ──
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/cards/${slug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadForm.name.trim(),
          email: leadForm.email.trim(),
          phone: leadForm.phone.trim() || undefined,
          message: leadForm.message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setLeadSuccess(data.message || "Thank you! We'll be in touch.");
      setLeadForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setLeadError(err.message);
    } finally {
      setLeadSubmitting(false);
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e18]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-gray-500 text-sm">Loading card...</p>
        </motion.div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e18] p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 max-w-sm w-full text-center"
        >
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Card Not Found</h2>
          <p className="text-gray-400 text-sm">
            {error || "The digital business card you're looking for doesn't exist."}
          </p>
        </motion.div>
      </div>
    );
  }

  const themeColor = card.theme_color || "#6d5cff";
  const cardUrl = `${SITE_URL}/c/${card.slug}`;
  const socials = Array.isArray(card.social_links) ? card.social_links : [];

  const handleSaveContact = () => {
    window.open(`${API_BASE}/api/v1/cards/${slug}/vcard`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0b0e18] noise">
      {/* Background gradient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${themeColor}12 0%, transparent 60%)`,
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-md mx-auto px-4 py-8 sm:py-12"
      >
        {/* ── Profile Card ── */}
        <motion.div variants={itemVariants} className="glass rounded-3xl p-6 sm:p-8 mb-4">
          {/* Video / Avatar */}
          <div className="mb-6">
            <VideoAvatar
              videoUrl={card.video_url}
              avatarUrl={card.avatar_url}
              name={card.full_name}
              themeColor={themeColor}
              size={140}
            />
          </div>

          {/* Name & Title */}
          <div className="text-center mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {card.full_name}
            </h1>
            {card.job_title && (
              <p className="text-base font-medium" style={{ color: themeColor }}>
                {card.job_title}
                {card.company && (
                  <span className="text-gray-400 font-normal"> at {card.company}</span>
                )}
              </p>
            )}
          </div>

          {/* Bio */}
          {card.bio && (
            <p className="text-gray-400 text-sm leading-relaxed text-center mb-6 max-w-xs mx-auto">
              {card.bio}
            </p>
          )}

          {/* Contact Info Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {card.email && (
              <a
                href={`mailto:${card.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           bg-surface-light/60 border border-surface-border
                           text-gray-300 hover:text-white hover:border-primary/50
                           transition-all text-xs"
              >
                <Mail size={13} />
                {card.email}
              </a>
            )}
            {card.phone && (
              <a
                href={`tel:+1${card.phone.replace(/\D/g, "")}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           bg-surface-light/60 border border-surface-border
                           text-gray-300 hover:text-white hover:border-primary/50
                           transition-all text-xs"
              >
                <Phone size={13} />
                {formatPhone(card.phone)}
              </a>
            )}
            {card.website && (
              <a
                href={card.website.startsWith("http") ? card.website : `https://${card.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           bg-surface-light/60 border border-surface-border
                           text-gray-300 hover:text-white hover:border-primary/50
                           transition-all text-xs"
              >
                <Globe size={13} />
                {card.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Social Links Grid */}
          {socials.length > 0 && (
            <div className="flex justify-center gap-3 mb-6">
              {socials.map((social, i) => {
                const config = getSocialConfig(social.platform);
                const Icon = config.icon;
                return (
                  <motion.a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center
                               bg-surface-light border border-surface-border
                               text-gray-400 hover:text-white
                               transition-all duration-200 hover:border-primary/50"
                    title={social.label || config.label}
                  >
                    <Icon />
                  </motion.a>
                );
              })}
            </div>
          )}

          {/* ── Phase 66: Inline QR Code ── */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white p-2.5 rounded-xl shadow-lg">
              <QRCodeSVG
                value={cardUrl}
                size={120}
                bgColor="#ffffff"
                fgColor={themeColor}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider font-medium">
              Scan to Connect
            </p>
          </div>

          {/* Save to Contacts — Primary CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveContact}
            className="w-full py-3.5 rounded-xl font-semibold text-white
                       flex items-center justify-center gap-2 cursor-pointer
                       shadow-lg transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, #00e5a0)`,
              boxShadow: `0 8px 32px ${themeColor}40`,
            }}
          >
            <Download size={18} />
            Save to Contacts
          </motion.button>

          {/* ── Phase 39: Connect with Me CTA ── */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowLeadForm(true); setLeadSuccess(null); setLeadError(null); }}
            className="w-full mt-3 py-3.5 rounded-xl font-semibold text-white
                       flex items-center justify-center gap-2 cursor-pointer
                       bg-surface-light border border-surface-border
                       hover:border-primary/50 transition-all duration-200"
          >
            <Handshake size={18} />
            Connect with Me
          </motion.button>
        </motion.div>

        {/* ── Phase 39: Lead Capture Modal ── */}
        {showLeadForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass rounded-2xl p-6 max-w-sm w-full relative border border-white/10"
            >
              <button
                onClick={() => setShowLeadForm(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              {leadSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">Connected!</h3>
                  <p className="text-sm text-gray-400">{leadSuccess}</p>
                  <button
                    onClick={() => setShowLeadForm(false)}
                    className="mt-4 px-6 py-2 rounded-lg text-sm font-medium text-white
                               transition-all cursor-pointer"
                    style={{ background: `linear-gradient(135deg, ${themeColor}, #00e5a0)` }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  <div className="text-center mb-4">
                    <Handshake size={28} className="mx-auto mb-2" style={{ color: themeColor }} />
                    <h3 className="text-lg font-semibold text-white">
                      Connect with {card.full_name?.split(" ")[0]}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Drop your info and {card.full_name?.split(" ")[0]} will be in touch</p>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Your name *"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-surface-border
                               text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50
                               transition-colors"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your email *"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-surface-border
                               text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50
                               transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-surface-border
                               text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50
                               transition-colors"
                  />
                  <textarea
                    placeholder="Quick note (optional)"
                    rows={2}
                    value={leadForm.message}
                    onChange={(e) => setLeadForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-surface-border
                               text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50
                               transition-colors resize-none"
                  />

                  {leadError && (
                    <p className="text-red-400 text-xs text-center">{leadError}</p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={leadSubmitting}
                    whileHover={{ scale: leadSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: leadSubmitting ? 1 : 0.98 }}
                    className="w-full py-3 rounded-xl font-semibold text-white
                               flex items-center justify-center gap-2 cursor-pointer
                               shadow-lg transition-all duration-200 disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${themeColor}, #00e5a0)`,
                      boxShadow: `0 6px 24px ${themeColor}30`,
                    }}
                  >
                    {leadSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {leadSubmitting ? "Sending..." : "Send"}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── QR Code Button ── */}
        <motion.div variants={itemVariants} className="mb-4">
          <QRModal url={cardUrl} name={card.full_name} themeColor={themeColor} />
        </motion.div>

        {/* ── Footer ── */}
        <motion.div variants={itemVariants} className="text-center">
          <p className="text-gray-600 text-xs">
            Powered by{" "}
            <a
              href="https://referralsvc.com"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Referral Service LLC
            </a>
          </p>
        </motion.div>
      </motion.div>

      {/* ── AI Chat Widget ── */}
      <CardChat
        slug={slug}
        cardHolderName={card.full_name}
        themeColor={themeColor}
      />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
