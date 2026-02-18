require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { v4: uuid } = require("uuid");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend in production
const distPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(distPath));

// ─── Leads CRUD ──────────────────────────────────────────────

app.get("/api/leads", (req, res) => {
  const { status, stage, search, sort, order } = req.query;
  let sql = "SELECT * FROM leads WHERE 1=1";
  const params = [];

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (stage) {
    sql += " AND stage = ?";
    params.push(stage);
  }
  if (search) {
    sql += " AND (name LIKE ? OR email LIKE ? OR company LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const sortCol = ["name", "created_at", "updated_at", "score", "amount", "status", "stage"].includes(sort) ? sort : "created_at";
  const sortDir = order === "asc" ? "ASC" : "DESC";
  sql += ` ORDER BY ${sortCol} ${sortDir}`;

  const leads = db.prepare(sql).all(...params);
  res.json(leads);
});

app.get("/api/leads/stats", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as count FROM leads").get().count;
  const byStage = db.prepare("SELECT stage, COUNT(*) as count FROM leads GROUP BY stage").all();
  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status").all();
  const totalAmount = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM leads").get().total;
  const recentLeads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT 5").all();

  res.json({ total, byStage, byStatus, totalAmount, recentLeads });
});

app.get("/api/leads/:id", (req, res) => {
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const messages = db.prepare("SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at ASC").all(req.params.id);
  const activities = db.prepare("SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC").all(req.params.id);

  res.json({ ...lead, messages, activities });
});

app.post("/api/leads", (req, res) => {
  const id = uuid();
  const { name, email, phone, company, title, source, status, stage, priority, notes, score, amount, assigned_to } = req.body;

  db.prepare(`
    INSERT INTO leads (id, name, email, phone, company, title, source, status, stage, priority, notes, score, amount, assigned_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name || null, email || null, phone || null, company || null, title || null, source || "manual", status || "new", stage || "inquiry", priority || "medium", notes || null, score || 0, amount || 0, assigned_to || null);

  logActivity(id, "created", "Lead created");

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  res.status(201).json(lead);
});

app.patch("/api/leads/:id", (req, res) => {
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const fields = ["name", "email", "phone", "company", "title", "source", "status", "stage", "priority", "notes", "score", "amount", "assigned_to"];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (updates.length === 0) return res.json(lead);

  updates.push("updated_at = datetime('now')");
  values.push(req.params.id);

  db.prepare(`UPDATE leads SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  // Log stage/status changes
  if (req.body.stage && req.body.stage !== lead.stage) {
    logActivity(req.params.id, "stage_change", `Stage changed from ${lead.stage} to ${req.body.stage}`);
  }
  if (req.body.status && req.body.status !== lead.status) {
    logActivity(req.params.id, "status_change", `Status changed from ${lead.status} to ${req.body.status}`);
  }

  const updated = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  res.json(updated);
});

app.delete("/api/leads/:id", (req, res) => {
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ─── Chat (AI-powered via Cloudflare Workers AI) ────────────

const CHAT_SYSTEM_PROMPT = `You are the AI assistant for Referral Service LLC, an AI-Human Hybrid venture studio.

Your role: Help website visitors understand our services, qualify leads, and schedule conversations with our team.

WHAT WE DO:
- We deploy "Digital Employees" — AI agents that work alongside human sales partners
- Our flagship product is Clawbot, an autonomous outbound sales agent that researches prospects, drafts personalized messages, and handles multi-channel outreach (SMS + email)
- We serve B2B companies looking to scale their go-to-market without hiring large SDR teams

OUR THREE SERVICE MODULES:
1. Digital SDR — AI-powered outbound prospecting, lead qualification, meeting scheduling. Integrates with CRM. Deploys in days.
2. Digital Support — AI ticket routing, response drafting, escalation management. Prebuilt helpdesk integrations.
3. Knowledge Ops — Automated document search, drafting, internal knowledge management with continuous refresh.

PRICING:
- Hybrid model: base "AI Salary" + performance-based billing
- This aligns our incentives with client outcomes
- Custom quotes based on volume and use case

WHAT IS A DIGITAL EMPLOYEE:
- A Digital Employee is an AI agent that performs real business tasks autonomously — like an SDR who never sleeps
- It researches prospects, writes personalized outreach, follows up, and escalates hot leads to human partners
- No setup required from the client — we deploy, configure, and manage everything
- The AI is always labeled as AI (full compliance and transparency)

COMPLIANCE & SECURITY:
- Every AI surface is explicitly labeled as AI
- Strict compliance posture with audit trails
- Data handling policies and SOC 2 readiness
- TCPA/CTIA compliant for SMS outreach

CONVERSATION RULES:
- Be concise (2-4 sentences per response)
- Be warm, professional, and confident
- Answer the visitor's actual question — don't redirect them
- If they ask what something is, explain it clearly
- Naturally guide toward scheduling a call or sharing their use case
- Never say "I don't know" — reframe around what we can help with
- If they share their name, email, or company, acknowledge it warmly`;

const RECRUIT_SYSTEM_PROMPT = `You are the recruitment interviewer for Referral Service LLC, an AI-Human Hybrid venture studio.

You are screening candidates for the "Deal Architect" role — a fractional CRO / senior sales closer who partners with our AI (Clawbot) to close enterprise deals. This is a 1099 partnership, not W-2 employment.

THE ROLE:
- Deal Architects are experienced enterprise closers who receive AI-sourced, AI-qualified, AI-briefed opportunities
- Clawbot handles prospecting, outreach, follow-up, and research — the Deal Architect handles the human relationship and closing
- Compensation: base retainer + performance bonus on closed revenue
- This is for senior sales professionals who want to close more deals without doing their own prospecting

YOUR INTERVIEW FLOW:
Ask these questions one at a time, in order. Wait for the candidate's answer before moving to the next question.

1. "What is your average deal size, and what industry do you primarily sell into?" (already asked in greeting)
2. "How many years of enterprise closing experience do you have? Have you carried a quota above $500K?"
3. "Are you comfortable working as a 1099 independent contractor with performance-based compensation?"
4. "Tell me about your most complex deal — what made it challenging, and how did you close it?"
5. "Are you currently employed, or available to start within the next 2 weeks?"

AFTER ALL 5 QUESTIONS:
Thank them warmly and say: "Great answers. I'm going to pass your profile to our CEO, Jamarr Mayes, for a final conversation. You'll hear from us within 48 hours. In the meantime, feel free to ask me anything about the role or Referral Service."

CONVERSATION RULES:
- Be warm, professional, and concise (2-3 sentences per response)
- Acknowledge each answer before asking the next question
- If the candidate asks about the role, comp, or company, answer clearly using the info above
- Do NOT ask multiple questions at once — one question per message
- Do NOT act as a customer service agent — you are interviewing them
- If they give a short or vague answer, gently probe deeper before moving on
- Track which question you're on based on conversation history`;


app.post("/api/chat", async (req, res) => {
  const { message, leadId, intent } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  let currentLeadId = leadId;

  // Try to extract lead info from message
  const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
  const companyMatch = message.match(/(?:from|at|work at|company is)\s+([A-Za-z0-9 &]+?)(?:\.|,|$|\s+(?:and|pain|my|our|we|i))/i);

  if (!currentLeadId && (nameMatch || emailMatch)) {
    currentLeadId = uuid();
    db.prepare(`
      INSERT INTO leads (id, name, email, company, source)
      VALUES (?, ?, ?, ?, 'chat')
    `).run(currentLeadId, nameMatch?.[1] || null, emailMatch?.[0] || null, companyMatch?.[1] || null);
    logActivity(currentLeadId, "created", "Lead auto-captured from chat");
  }

  // Save user message
  const userMsgId = uuid();
  db.prepare("INSERT INTO messages (id, lead_id, role, text) VALUES (?, ?, 'user', ?)").run(userMsgId, currentLeadId, message);

  // Build conversation history for context (last 10 messages)
  let conversationHistory = [];
  if (currentLeadId) {
    const priorMessages = db.prepare(
      "SELECT role, text FROM messages WHERE lead_id = ? ORDER BY created_at DESC LIMIT 10"
    ).all(currentLeadId);
    conversationHistory = priorMessages.reverse().map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));
  } else {
    conversationHistory = [{ role: "user", content: message }];
  }

  // Select system prompt and model based on intent
  const isRecruit = intent === "apply_deal_architect";
  const systemPrompt = isRecruit ? RECRUIT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT;
  // Use 70B for recruitment interviews (better state tracking), 8B for general chat (lower cost)
  const model = isRecruit
    ? "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    : "@cf/meta/llama-3.1-8b-instruct";

  // Generate AI-powered reply via Cloudflare Workers AI
  let reply;
  try {
    reply = await generateAIReply(conversationHistory, systemPrompt, model);
  } catch (err) {
    console.error("[CHAT] AI reply failed, using fallback:", err.message);
    reply = intent === "apply_deal_architect"
      ? "Thanks for your interest in the Deal Architect role! I'm having a brief technical issue. Please try again in a moment, or email careers@referralservice.llc to continue your application."
      : generateReply(message); // Fall back to keyword matcher
  }

  const replyId = uuid();
  db.prepare("INSERT INTO messages (id, lead_id, role, text) VALUES (?, ?, 'assistant', ?)").run(replyId, currentLeadId, reply);

  res.json({
    reply: {
      id: replyId,
      leadId: currentLeadId,
      role: "assistant",
      text: reply,
      metadata: null,
      createdAt: new Date().toISOString(),
    },
    leadId: currentLeadId,
    toolCall: null,
  });
});

/**
 * Call Cloudflare Workers AI (Llama 3.1 8B) for intelligent chat responses.
 * Falls back to keyword matcher if CF credentials are not configured.
 */
async function generateAIReply(conversationHistory, systemPrompt = CHAT_SYSTEM_PROMPT, model = "@cf/meta/llama-3.1-8b-instruct") {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("CF_ACCOUNT_ID or CF_API_TOKEN not configured");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
        ],
        max_tokens: 300,
        temperature: 0.4,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const aiReply = data?.result?.response;

  if (!aiReply) {
    throw new Error("No response from Cloudflare AI");
  }

  return aiReply.trim();
}

// ─── Activities ──────────────────────────────────────────────

app.get("/api/activities", (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, l.name as lead_name, l.company as lead_company
    FROM activities a
    LEFT JOIN leads l ON a.lead_id = l.id
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all();
  res.json(activities);
});

// ─── Helpers ─────────────────────────────────────────────────

function logActivity(leadId, type, description) {
  db.prepare("INSERT INTO activities (id, lead_id, type, description) VALUES (?, ?, ?, ?)").run(uuid(), leadId, type, description);
}

function generateReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("sdr") || lower.includes("sales")) {
    return "Our Digital SDR module handles outbound prospecting, lead qualification, and meeting scheduling. It integrates with your CRM and can be deployed in days. Want me to walk you through the setup?";
  }
  if (lower.includes("support") || lower.includes("help desk") || lower.includes("customer")) {
    return "The Digital Support module provides AI-powered ticket routing, response drafting, and escalation management. It comes with prebuilt integration scaffolds for common helpdesk platforms. Shall I share the deployment timeline?";
  }
  if (lower.includes("knowledge") || lower.includes("docs") || lower.includes("documentation")) {
    return "Knowledge Ops automates document search, drafting, and internal knowledge management with a continuous KB refresh pipeline. What kind of content are you managing?";
  }
  if (lower.includes("pricing") || lower.includes("cost") || lower.includes("price")) {
    return "We offer hybrid pricing: a base AI Salary plus performance-based billing. This aligns our incentives with your outcomes. Want me to put together a custom quote?";
  }
  if (lower.includes("compliance") || lower.includes("security") || lower.includes("regulated")) {
    return "Every agent surface is explicitly labeled as AI. We maintain strict compliance posture with audit trails, data handling policies, and SOC 2 readiness. Want to see our compliance notes?";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Welcome to Referral Service LLC! We deploy Digital Employees for SDR, Support, and Knowledge Ops workflows. What's your use case?";
  }

  return "Understood. Tell me what you're trying to automate (SDR, support, or knowledge ops) and your timeline.";
}

// ─── SPA fallback ────────────────────────────────────────────
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
