import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Rocket, CheckCircle, AlertCircle, ArrowLeft, Send } from "lucide-react";

const API_BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

const INTAKE_FIELDS = [
  {
    key: "businessGoal",
    label: "Primary Business Goal",
    placeholder: "What is the #1 outcome you want from this project?",
    type: "textarea",
  },
  {
    key: "targetAudience",
    label: "Target Audience",
    placeholder: "Who are your ideal customers or end users?",
    type: "textarea",
  },
  {
    key: "brandAssets",
    label: "Link to Brand Assets / Google Drive",
    placeholder: "https://drive.google.com/... or any relevant links",
    type: "text",
  },
  {
    key: "timeline",
    label: "Any Deadlines or Timeline Constraints?",
    placeholder: "e.g., Launch by Q2, event on April 15th, etc.",
    type: "text",
  },
];

export default function KickoffPortal() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/api/v1/onboarding/${id}`)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404
              ? "Onboarding session not found"
              : `Error ${res.status}`
          );
        return res.json();
      })
      .then((data) => {
        if (data.status === "completed") {
          setSubmitted(true);
        }
        setOnboarding(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/onboarding/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formData }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Error ${res.status}`);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    );
  }

  // Error state
  if (error && !onboarding) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass noise rounded-2xl border border-white/5 p-8 max-w-md text-center relative"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Session Not Found
          </h2>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  // Already submitted state
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass noise rounded-2xl border border-white/5 p-10 max-w-md text-center relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Requirements Received!
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Thank you{onboarding?.prospectName ? `, ${onboarding.prospectName.split(" ")[0]}` : ""}!
            Our team is reviewing your project details and will reach out within 24
            hours to schedule your kickoff call.
          </p>
        </motion.div>
      </div>
    );
  }

  // Intake form
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-8">
      {/* Ambient gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <Rocket className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-xs font-medium tracking-wide uppercase">
              Project Kickoff
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome{onboarding?.prospectName ? `, ${onboarding.prospectName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Help us understand your vision. Fill out the details below so our
            team can prepare a tailored kickoff strategy for you.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass noise rounded-2xl border border-white/5 p-6 md:p-8"
        >
          <div className="space-y-6">
            {INTAKE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={formData[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Requirements
              </>
            )}
          </button>
        </motion.form>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-6">
          Powered by Referral Service LLC
        </p>
      </div>
    </div>
  );
}
