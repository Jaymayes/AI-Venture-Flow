import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Clock,
  Rocket,
  Loader,
  Play,
  FolderOpen,
  Upload,
  Download,
  Mail,
  Shield,
  KeyRound,
} from "lucide-react";
import { Link } from "wouter";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

const API_BASE =
  import.meta.env.VITE_TRIAGE_API_BASE ||
  "https://api.referralsvc.com";

// ── Session helpers ──
const CLIENT_TOKEN_KEY = "rsllc_client_token";

function getStoredToken(dealId) {
  try {
    const raw = sessionStorage.getItem(`${CLIENT_TOKEN_KEY}:${dealId}`);
    if (!raw) return null;
    // Check expiry client-side (JWT exp claim)
    const payload = JSON.parse(atob(raw.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp * 1000 < Date.now()) {
      sessionStorage.removeItem(`${CLIENT_TOKEN_KEY}:${dealId}`);
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

function storeToken(dealId, token) {
  sessionStorage.setItem(`${CLIENT_TOKEN_KEY}:${dealId}`, token);
}

function authHeaders(dealId) {
  const token = getStoredToken(dealId);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── OTP Gate Component ──
function OtpGate({ dealId, onAuthenticated }) {
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRefs = useRef([]);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/portal/${dealId}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send code");
      }
      setStep("otp");
      // Focus first OTP input after render
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(code) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/portal/${dealId}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Verification failed");
      storeToken(dealId, data.token);
      onAuthenticated();
    } catch (err) {
      setError(err.message);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index, value) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const code = next.join("");
      if (code.length === 6) handleOtpSubmit(code);
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      const next = pasted.split("");
      setOtp(next);
      inputRefs.current[5]?.focus();
      handleOtpSubmit(pasted);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e18] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Card variant="client" className="p-8 md:p-10">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield size={22} className="text-emerald-400" />
            </div>
            <p className="text-slate-500 text-[11px] tracking-widest uppercase mb-1">
              Referral Service LLC
            </p>
            <h2 className="text-xl font-bold text-white">
              {step === "email" ? "Project Portal" : "Enter Access Code"}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {step === "email"
                ? "Enter the email associated with your project."
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit}>
              <div className="relative mb-4">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <Button
                variant="primary"
                size="md"
                disabled={loading || !email.trim()}
                className="w-full"
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <>
                    <KeyRound size={14} />
                    Send Access Code
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div>
              <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-13 rounded-xl bg-slate-800/50 border border-slate-700/60 text-center text-white text-lg font-mono font-bold focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Loader size={14} className="text-emerald-400 animate-spin" />
                  <span className="text-slate-500 text-sm">Verifying...</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", "", "", ""]);
                  setError(null);
                }}
                className="w-full text-center text-slate-600 text-xs hover:text-slate-400 transition-colors mt-2"
              >
                Use a different email
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/40 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-600 text-xs hover:text-slate-400 transition-colors"
            >
              <ArrowLeft size={12} />
              referralsvc.com
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// ── Portal Status Helper ──
function getPortalStatus(data) {
  if (!data) return { label: "Loading", color: "neutral", icon: Loader };
  const { sow, project } = data;
  if (sow.status === "sent" || sow.status === "viewed") {
    return { label: "Pending Payment", color: "warning", icon: Clock };
  }
  if (!project) {
    return { label: "Planning", color: "info", icon: Loader };
  }
  if (project.status === "completed") {
    return { label: "Completed", color: "success", icon: CheckCircle };
  }
  return { label: "In Progress", color: "purple", icon: Rocket };
}

// ── Main Component ──
export default function ClientPortal() {
  const { id } = useParams();
  const [authenticated, setAuthenticated] = useState(() => !!getStoredToken(id));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("plan");
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Show OTP gate if not authenticated
  if (!authenticated) {
    return (
      <OtpGate
        dealId={id}
        onAuthenticated={() => setAuthenticated(true)}
      />
    );
  }

  async function fetchAssets() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/portal/${id}/assets`, {
        headers: authHeaders(id),
      });
      if (res.status === 401) { setAuthenticated(false); return; }
      if (res.ok) {
        const json = await res.json();
        setAssets(json.assets || []);
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchAssets();
  }, [id, authenticated]);

  useEffect(() => {
    async function fetchPortal() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/portal/${id}`, {
          headers: authHeaders(id),
        });
        if (res.status === 401) { setAuthenticated(false); return; }
        if (!res.ok) {
          if (res.status === 404) throw new Error("Portal not found");
          throw new Error("Failed to load portal");
        }
        const json = await res.json();
        setData(json);
        if (!json.project) setActiveTab("contract");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (authenticated) fetchPortal();
  }, [id, authenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e18] flex items-center justify-center">
        <RefreshCw size={24} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0e18] flex items-center justify-center px-4">
        <Card variant="client" className="p-8 max-w-md w-full text-center">
          <Briefcase size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-600 text-xs hover:text-slate-400 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Referral Service LLC
          </Link>
        </Card>
      </div>
    );
  }

  const status = getPortalStatus(data);
  const StatusIcon = status.icon;
  const tabs = [
    { id: "plan", label: "Execution Plan", icon: Rocket, disabled: !data.project },
    { id: "contract", label: "Contract", icon: FileText, disabled: false },
    { id: "assets", label: "Asset Vault", icon: FolderOpen, disabled: false },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e18]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-slate-600 text-[11px] tracking-widest uppercase mb-2">
            Referral Service LLC
          </p>
          <h1 className="text-3xl font-bold text-white mb-2">
            Project Portal
          </h1>
          <p className="text-slate-500 text-sm">
            Welcome back,{" "}
            <span className="text-white font-medium">{data.client.name}</span>
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Badge variant="client" color={status.color}>
              <StatusIcon size={12} className="mr-1.5" />
              {status.label}
            </Badge>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-slate-800/80 text-white border border-slate-700/60"
                    : tab.disabled
                    ? "text-slate-700 cursor-not-allowed"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                }`}
              >
                <TabIcon size={14} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        {activeTab === "plan" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="client" className="p-8 md:p-10 mb-8">
              {data.project ? (
                <>
                  {/* Phase 52: Progress bar + task tracker */}
                  {(() => {
                    const tasks = data.project.tasks || [];
                    const total = tasks.length;
                    const doneCount = tasks.filter(t => t.status === "done").length;
                    const inProgCount = tasks.filter(t => t.status === "in_progress").length;
                    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

                    if (total === 0) return null;

                    return (
                      <div className="mb-8">
                        {/* Progress header */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-slate-400">Project Progress</h3>
                          <span className="text-xs text-slate-500">
                            {doneCount} of {total} tasks complete
                            {inProgCount > 0 && <span className="text-emerald-400 ml-1">({inProgCount} in progress)</span>}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 rounded-full bg-slate-800/60 overflow-hidden mb-5">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Task list */}
                        <div className="space-y-2">
                          {tasks.map((task) => {
                            const statusIcon = task.status === "done"
                              ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                              : task.status === "in_progress"
                              ? <Play size={14} className="text-amber-400 flex-shrink-0" />
                              : <Clock size={14} className="text-slate-600 flex-shrink-0" />;
                            const textColor = task.status === "done"
                              ? "text-emerald-300"
                              : task.status === "in_progress"
                              ? "text-amber-300"
                              : "text-slate-500";

                            return (
                              <div key={task.id} className="flex items-start gap-3 rounded-lg bg-slate-800/30 border border-slate-800/40 px-4 py-3">
                                <div className="mt-0.5">{statusIcon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="client" color="purple">
                                      Phase {task.phase}
                                    </Badge>
                                    <span className={`text-sm font-medium ${textColor} truncate`}>{task.title}</span>
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Divider before plan */}
                        <div className="border-t border-slate-800/40 mt-6 pt-6">
                          <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-4">Full Execution Plan</p>
                        </div>
                      </div>
                    );
                  })()}

                  <div
                    className="plan-content text-slate-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: data.project.planHtml }}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <Loader size={32} className="text-emerald-400/50 mx-auto mb-3 animate-spin" />
                  <p className="text-slate-500 text-sm">
                    Your project plan is being generated...
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    This typically takes a few moments after submitting your requirements.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === "contract" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="client" className="p-8 md:p-10 mb-8">
              <div
                className="sow-content text-slate-300 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.sow.html }}
              />
            </Card>
          </motion.div>
        )}

        {activeTab === "assets" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="client" className="p-8 md:p-10 mb-8">
              {/* Upload zone */}
              <label
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all py-10 mb-6 ${
                  uploading
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-slate-800/60 hover:border-emerald-500/30 hover:bg-slate-800/20"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader size={28} className="text-emerald-400 animate-spin" />
                    <p className="text-sm text-emerald-300">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-slate-600" />
                    <p className="text-sm text-slate-500">
                      Click to upload files{" "}
                      <span className="text-slate-600">(max 10 MB each)</span>
                    </p>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    setUploading(true);
                    for (const file of files) {
                      const fd = new FormData();
                      fd.append("file", file);
                      try {
                        const res = await fetch(`${API_BASE}/api/v1/portal/${id}/assets`, {
                          method: "POST",
                          headers: authHeaders(id),
                          body: fd,
                        });
                        if (res.status === 401) { setAuthenticated(false); return; }
                      } catch { /* silent */ }
                    }
                    await fetchAssets();
                    setUploading(false);
                    e.target.value = "";
                  }}
                />
              </label>

              {/* File list */}
              {assets.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No assets uploaded yet</p>
                  <p className="text-slate-600 text-xs mt-1">
                    Upload logos, brand guidelines, or project documents above.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.key}
                      className="flex items-center gap-3 rounded-lg bg-slate-800/30 border border-slate-800/40 px-4 py-3"
                    >
                      <FileText size={16} className="text-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate">{asset.name}</p>
                        <p className="text-xs text-slate-600">
                          {asset.size < 1024
                            ? `${asset.size} B`
                            : asset.size < 1048576
                            ? `${(asset.size / 1024).toFixed(1)} KB`
                            : `${(asset.size / 1048576).toFixed(1)} MB`}
                          {asset.uploaded && (
                            <span className="ml-2">
                              {new Date(asset.uploaded).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <a
                        href={`${API_BASE}/api/v1/assets/${id}/${encodeURIComponent(asset.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-emerald-400 transition-colors"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-600 text-xs hover:text-slate-400 transition-colors"
          >
            <ArrowLeft size={12} />
            referralsvc.com
          </Link>
        </div>
      </div>

      {/* Content Styles */}
      <style>{`
        .sow-content h2, .plan-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: rgba(255,255,255,0.95);
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgb(30, 41, 59, 0.4);
        }
        .sow-content h3, .plan-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .plan-content h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgb(52, 211, 153, 0.9);
          margin-top: 1rem;
          margin-bottom: 0.4rem;
        }
        .sow-content p, .plan-content p {
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }
        .sow-content ul, .plan-content ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .sow-content li, .plan-content li {
          margin-bottom: 0.35rem;
        }
        .sow-content strong, .plan-content strong {
          color: rgba(255,255,255,0.9);
        }
        .sow-content table, .plan-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .sow-content th, .sow-content td,
        .plan-content th, .plan-content td {
          padding: 0.5rem 0.75rem;
          border: 1px solid rgb(51, 65, 85, 0.4);
          text-align: left;
          font-size: 0.8125rem;
        }
        .sow-content th, .plan-content th {
          background: rgba(15, 23, 42, 0.5);
          color: rgba(255,255,255,0.7);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
