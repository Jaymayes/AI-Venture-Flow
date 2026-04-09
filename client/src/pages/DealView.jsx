import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  FileText,
  CreditCard,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import { Link } from "wouter";

const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

const STATUS_CONFIG = {
  sent: { label: "Pending Review", color: "bg-blue-500/20 text-blue-300", icon: Clock },
  viewed: { label: "Under Review", color: "bg-amber-500/20 text-amber-300", icon: Eye },
  paid: { label: "Accepted & Paid", color: "bg-emerald-500/20 text-emerald-300", icon: CheckCircle },
};

export default function DealView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDeal() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/deals/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Deal not found");
          throw new Error("Failed to load deal");
        }
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          throw new Error(json.error || "Unknown error");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDeal();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw size={24} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass noise rounded-2xl p-8 max-w-md w-full border border-white/10 text-center">
          <FileText size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/40 text-xs hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Referral Service LLC
          </Link>
        </div>
      </div>
    );
  }

  const { deal, prospect } = data;
  const statusCfg = STATUS_CONFIG[deal.status] || STATUS_CONFIG.sent;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-white/30 text-xs tracking-widest uppercase mb-2">
            Referral Service LLC
          </p>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Statement of Work
          </h1>
          <p className="text-white/50 text-sm">
            Prepared for{" "}
            <span className="text-white font-medium">{prospect.name}</span>
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${statusCfg.color}`}
            >
              <StatusIcon size={12} />
              {statusCfg.label}
            </span>
            <span className="text-white/20 text-xs">
              {new Date(deal.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </motion.div>

        {/* SOW Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass noise rounded-2xl border border-white/5 p-8 md:p-10 mb-8"
        >
          <div
            className="sow-content text-white/80 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: deal.sowHtml }}
          />
        </motion.div>

        {/* CTA */}
        {deal.status !== "paid" && deal.stripeLink && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <a
              href={`${deal.stripeLink}?client_reference_id=${deal.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold text-base hover:opacity-90 transition-opacity"
            >
              <CreditCard size={18} />
              Accept & Pay
            </a>
            <p className="text-white/20 text-xs mt-3">
              Secure payment powered by Stripe
            </p>
          </motion.div>
        )}

        {deal.status === "paid" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass noise rounded-xl border border-emerald-500/20 p-6 text-center"
          >
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-300 font-semibold">
              Payment Received
            </p>
            <p className="text-white/40 text-xs mt-1">
              Thank you for your business. Our team will be in touch shortly.
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/20 text-xs hover:text-white/40 transition-colors"
          >
            <ArrowLeft size={12} />
            referralsvc.com
          </Link>
        </div>
      </div>

      {/* SOW Content Styles */}
      <style>{`
        .sow-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: rgba(255,255,255,0.95);
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sow-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .sow-content p {
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }
        .sow-content ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .sow-content li {
          margin-bottom: 0.35rem;
        }
        .sow-content strong {
          color: rgba(255,255,255,0.9);
        }
        .sow-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .sow-content th, .sow-content td {
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255,255,255,0.08);
          text-align: left;
          font-size: 0.8125rem;
        }
        .sow-content th {
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.7);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
