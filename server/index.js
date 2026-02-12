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

// ─── Chat ────────────────────────────────────────────────────

app.post("/api/chat", (req, res) => {
  const { message, leadId } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  let currentLeadId = leadId;

  // Try to extract lead info from message
  const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
  // Match company name but stop before common sentence continuations
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

  // Generate contextual reply
  const reply = generateReply(message);
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
