import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

/**
 * CardChat — AI chat widget for the Digital Business Card.
 *
 * Expandable floating panel that posts to the card's /chat endpoint.
 * Maintains conversation history locally and passes it to the API
 * for multi-turn context.
 *
 * @param {string} slug - Card slug for the API endpoint
 * @param {string} cardHolderName - Name shown in the chat header
 * @param {string} themeColor - Accent color for UI elements
 */
export default function CardChat({
  slug,
  cardHolderName = "AI Assistant",
  themeColor = "#6d5cff",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm ${cardHolderName}'s AI assistant. How can I help you today? Feel free to ask about services, schedule a call, or share your contact info for a follow-up.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(
    () => `dbc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/api/v1/cards/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          history,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "I'm sorry, I couldn't process that request.",
          tier: data.tier,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err.message === "Rate limit exceeded. Please wait a moment before sending another message."
              ? "⏳ I'm getting a lot of messages right now. Please wait a moment and try again."
              : "I'm having trouble connecting right now. Please try again in a moment.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${themeColor}, #00e5a0)` }}
          >
            <MessageCircle size={24} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[400px] z-50
                       flex flex-col max-h-[80vh] rounded-2xl overflow-hidden
                       border border-surface-border shadow-2xl"
            style={{ background: "rgba(22, 26, 39, 0.95)", backdropFilter: "blur(20px)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-surface-border"
              style={{
                background: `linear-gradient(135deg, ${themeColor}15, transparent)`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `${themeColor}30` }}
                >
                  <Sparkles size={16} style={{ color: themeColor }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Chat with {cardHolderName.split(" ")[0]}'s AI
                  </p>
                  <p className="text-xs text-gray-500">Powered by ReferralSvc</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[50vh]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${themeColor}25` }}
                    >
                      <Bot size={14} style={{ color: themeColor }} />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : msg.isError
                        ? "bg-red-900/30 text-red-300 border border-red-800/50 rounded-bl-md"
                        : "bg-surface-light text-gray-200 border border-surface-border rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-1.5 last:mb-0">{children}</p>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent underline"
                            >
                              {children}
                            </a>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-white font-semibold">
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-surface-light border border-surface-border">
                      <User size={14} className="text-gray-400" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${themeColor}25` }}
                  >
                    <Bot size={14} style={{ color: themeColor }} />
                  </div>
                  <div className="bg-surface-light border border-surface-border rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Loader2
                        size={14}
                        className="animate-spin"
                        style={{ color: themeColor }}
                      />
                      <span className="text-xs text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-surface-border">
              <div className="flex items-center gap-2 bg-surface-light rounded-xl border border-surface-border px-3 py-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500
                             outline-none py-1.5"
                  maxLength={2000}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-lg transition-all cursor-pointer
                             disabled:opacity-30 disabled:cursor-not-allowed
                             hover:bg-white/10"
                  style={{ color: themeColor }}
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
