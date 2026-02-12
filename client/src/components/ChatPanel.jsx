import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { apiFetch } from "../lib/api";

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm the Referral Service AI assistant. I can help you learn about our AI Digital Employees, get pricing info, or connect you with our team. How can I help you today?",
};

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiFetch("POST", "/api/chat", {
        message: text,
        leadId,
      });
      if (data.leadId) setLeadId(data.leadId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.message || "Thanks for reaching out!" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30 transition hover:scale-105 hover:opacity-90"
        aria-label="Toggle chat"
      >
        {open ? (
          <X size={22} className="text-black" />
        ) : (
          <MessageCircle size={22} className="text-black" />
        )}
      </button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass noise fixed bottom-24 left-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Bot size={18} className="text-black" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">AI Assistant</div>
                <div className="text-xs text-white/40">
                  Referral Service LLC
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-gradient-to-r from-primary to-accent text-black"
                        : "rounded-bl-md border border-white/10 bg-white/5 text-white/90"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/40">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce [animation-delay:0.15s]">.</span>
                      <span className="animate-bounce [animation-delay:0.3s]">.</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type to chat..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent text-black transition hover:opacity-90 disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
