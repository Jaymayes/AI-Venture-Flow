/**
 * DealRoom.jsx — Client-Facing SOW Signing & Payment (Phase 24)
 *
 * Public, unauthenticated page accessed via magic link:
 *   /deal-room/:token
 *
 * Flow: Load deal room -> Review SOW -> Enter signature -> Sign & Pay
 */

import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  PenTool,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Shield,
  Building2,
} from "lucide-react";

const BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

// ---------------------------------------------------------------------------
// Simple Markdown Renderer (handles headings, bold, lists, tables, hr)
// ---------------------------------------------------------------------------

function renderMarkdown(md) {
  if (!md) return null;
  const lines = md.split("\n");
  const elements = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const dataRows = tableRows.slice(2); // skip separator row
      elements.push(
        <table
          key={`tbl-${elements.length}`}
          className="w-full text-sm border-collapse my-4"
        >
          <thead>
            <tr>
              {headerRow
                .split("|")
                .filter((c) => c.trim())
                .map((cell, i) => (
                  <th
                    key={i}
                    className="text-left py-2 px-3 border-b border-white/10 text-white/70 font-semibold"
                  >
                    {cell.trim()}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri}>
                {row
                  .split("|")
                  .filter((c) => c.trim())
                  .map((cell, ci) => (
                    <td
                      key={ci}
                      className="py-2 px-3 border-b border-white/5 text-white/60"
                    >
                      {cell.trim()}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection
    if (line.includes("|") && line.trim().startsWith("|")) {
      inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(
        <hr key={i} className="border-white/10 my-6" />
      );
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-3">
          {line.slice(2)}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-white mt-5 mb-2">
          {line.slice(3)}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-white/90 mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    // List items
    if (line.startsWith("- ")) {
      const content = line.slice(2);
      elements.push(
        <div key={i} className="flex gap-2 ml-4 my-1">
          <span className="text-cyan-400 mt-1.5 text-xs">&#9679;</span>
          <p className="text-white/60 text-sm leading-relaxed">
            {renderInline(content)}
          </p>
        </div>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-white/60 text-sm leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
  }

  flushTable();
  return elements;
}

function renderInline(text) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white/80 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Italic *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="text-white/50 italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }) {
  const steps = [
    { key: "review", label: "Review SOW", icon: FileText },
    { key: "sign", label: "Sign", icon: PenTool },
    { key: "pay", label: "Payment", icon: CreditCard },
    { key: "done", label: "Complete", icon: CheckCircle2 },
  ];

  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentIdx;
        const isComplete = idx < currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isComplete
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isActive
                  ? "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-400/30"
                  : "bg-white/5 text-white/20"
              }`}
            >
              {isComplete ? (
                <CheckCircle2 size={14} />
              ) : (
                <Icon size={14} />
              )}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                isActive ? "text-white/70" : "text-white/30"
              }`}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`w-8 h-px ${
                  isComplete ? "bg-emerald-400/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DealRoom Component
// ---------------------------------------------------------------------------

export default function DealRoom() {
  const [, params] = useRoute("/deal-room/:token");
  const token = params?.token;

  const [dealRoom, setDealRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("review"); // review | sign | pay | done
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [polling, setPolling] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);

  // Load deal room data
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${BASE}/api/deal-room/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Deal room not found (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setDealRoom(data.dealRoom);
        if (data.dealRoom?.payment_status === "paid") {
          setStep("done");
          setCheckoutResult({
            signerName: data.dealRoom.signer_name,
            signedAt: data.dealRoom.sow_signed_at,
            tcv: data.dealRoom.tcv,
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Detect return from Stripe checkout (Phase 30)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentParam = searchParams.get("payment");

    if (paymentParam === "cancelled") {
      setPaymentCancelled(true);
      setStep("sign");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (paymentParam === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setStep("pay");
      setPolling(true);
    }
  }, []);

  // Poll for payment confirmation after Stripe redirect (Phase 30)
  useEffect(() => {
    if (!polling || !token) return;
    let cancelled = false;

    const poll = async () => {
      let attempts = 0;
      while (!cancelled && attempts < 150) {
        attempts++;
        try {
          const res = await fetch(`${BASE}/api/deal-room/${token}`);
          if (res.ok) {
            const data = await res.json();
            if (data.dealRoom?.payment_status === "paid") {
              setDealRoom(data.dealRoom);
              setCheckoutResult({
                signerName: data.dealRoom.signer_name,
                signedAt: data.dealRoom.sow_signed_at,
                tcv: data.dealRoom.tcv,
              });
              setStep("done");
              setPolling(false);
              return;
            }
          }
        } catch {
          /* retry on network error */
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      // Timeout — stop polling
      setPolling(false);
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [polling, token]);

  // Handle checkout
  const handleCheckout = async () => {
    if (!signerName.trim() || signerName.trim().length < 2) {
      setSignError("Please enter your full legal name (at least 2 characters).");
      return;
    }
    setSigning(true);
    setSignError(null);
    try {
      const res = await fetch(`${BASE}/api/deal-room/${token}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: signerName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Checkout failed (${res.status})`);
      }
      const data = await res.json();

      // Live Stripe mode: redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return; // Browser navigates away
      }

      // Mock mode: immediate completion (existing behavior)
      setCheckoutResult(data);
      setStep("done");
    } catch (err) {
      setSignError(err.message);
    } finally {
      setSigning(false);
    }
  };

  // Not found
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400/50 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-white/40 text-sm">
            This deal room link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading your deal room...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400/50 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Deal Room Unavailable</h1>
          <p className="text-white/40 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[160px]" />
        <div className="absolute bottom-0 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
            <Building2 size={16} className="text-cyan-400" />
            <span className="text-white/60 text-sm font-medium">
              Referral SVC LLC
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            AI Transformation Deal Room
          </h1>
          {dealRoom && (
            <p className="text-white/40 text-sm">
              Prepared for{" "}
              <span className="text-white/60 font-medium">
                {dealRoom.prospect_name || "Client"}
              </span>
              {dealRoom.prospect_company && (
                <>
                  {" "}
                  at{" "}
                  <span className="text-white/60 font-medium">
                    {dealRoom.prospect_company}
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* SOW Review */}
        {step === "review" && dealRoom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass noise rounded-2xl p-6 sm:p-8 border border-white/10 mb-6">
              {renderMarkdown(dealRoom.sow_markdown)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <Shield size={12} />
                <span>Secure & encrypted deal room</span>
              </div>
              <button
                onClick={() => setStep("sign")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Proceed to Sign
              </button>
            </div>
          </motion.div>
        )}

        {/* Signing Step */}
        {step === "sign" && dealRoom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass noise rounded-2xl p-6 sm:p-8 border border-white/10 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <PenTool size={24} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Digital Signature
                  </h2>
                  <p className="text-white/40 text-sm">
                    By signing below, you agree to the terms outlined in the
                    Statement of Work.
                  </p>
                </div>
              </div>

              {/* Contract Summary */}
              <div className="glass noise rounded-xl p-4 border border-white/5 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/30 text-xs mb-1">Client</p>
                    <p className="text-white font-medium text-sm">
                      {dealRoom.prospect_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Company</p>
                    <p className="text-white font-medium text-sm">
                      {dealRoom.prospect_company || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">
                      Total Contract Value
                    </p>
                    <p className="text-emerald-400 font-bold text-lg">
                      ${(dealRoom.tcv || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Date</p>
                    <p className="text-white font-medium text-sm">
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signature Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white/60 mb-2">
                  Full Legal Name (Digital Signature)
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => {
                    setSignerName(e.target.value);
                    setSignError(null);
                  }}
                  placeholder="Enter your full legal name"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 transition-all font-serif text-lg italic"
                  autoFocus
                />
                {signerName.trim().length >= 2 && (
                  <div className="mt-3 p-3 rounded-lg border border-violet-500/20 bg-violet-500/5">
                    <p className="text-white/30 text-xs mb-1">
                      Signature Preview
                    </p>
                    <p className="text-violet-300 font-serif text-xl italic">
                      {signerName.trim()}
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {signError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mb-4 text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-lg p-3"
                  >
                    {signError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("review")}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Back to SOW
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={signing || signerName.trim().length < 2}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {signing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Sign & Fund Project — $
                      {(dealRoom.tcv || 0).toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-white/20 text-xs">
              <Shield size={12} />
              <span>256-bit encrypted · SOC 2 compliant</span>
            </div>
          </motion.div>
        )}

        {/* Payment Processing — polling after Stripe redirect (Phase 30) */}
        {step === "pay" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass noise rounded-2xl p-8 sm:p-12 border border-cyan-500/20 text-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 size={40} className="text-cyan-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Confirming Payment
              </h2>
              <p className="text-white/40 text-sm mb-4 max-w-md mx-auto">
                {polling
                  ? "We're confirming your payment with Stripe. This usually takes just a moment..."
                  : "Payment is being confirmed. You'll receive an email confirmation shortly. You can safely close this page."}
              </p>
              <div className="flex items-center justify-center gap-2 text-white/20 text-xs">
                <Shield size={12} />
                <span>Secure payment processing via Stripe</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Cancelled banner (Phase 30) */}
        {paymentCancelled && step === "sign" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="glass noise rounded-xl p-4 border border-amber-500/20 flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-amber-400 text-sm font-medium">Payment cancelled</p>
                <p className="text-white/40 text-xs">You can try again by clicking the payment button below.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Completion */}
        {step === "done" && checkoutResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="glass noise rounded-2xl p-8 sm:p-12 border border-emerald-500/20 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                SOW Signed & Payment Received
              </h2>
              <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">
                Your engagement with Referral SVC LLC is now active. Our team
                will reach out within 5 business days to schedule your kickoff.
              </p>

              <div className="glass noise rounded-xl p-5 border border-white/5 max-w-sm mx-auto">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-white/30 text-xs">Signed By</span>
                    <span className="text-white font-medium text-sm">
                      {checkoutResult.signerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30 text-xs">Contract Value</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      ${(checkoutResult.tcv || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30 text-xs">Signed At</span>
                    <span className="text-white/60 text-sm">
                      {checkoutResult.signedAt
                        ? new Date(checkoutResult.signedAt).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30 text-xs">Status</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 size={10} />
                      Paid & Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
