# 🚀 Agent Communication & Email Architecture (Revised)

## 📌 Overview

This document defines the role of email within a **local-first Electron-based AI workspace** consisting of multiple agents and internal tools.

> ⚠️ **Key Principle:**
> Email is **not part of the core system logic**. It is used only for **notifications, visibility, and external-style communication**.

The core system runs entirely **locally** using:

* Electron (Main + Renderer)
* Agent coordination layer
* Local event-driven communication

---

## 🧠 System Architecture

```text
Human
  ↕
Electron App (Core System)
  ↕
Agent Layer (Task Execution & Logic)
  ↕
Local Event System (Primary Communication)
  ↕
-----------------------------------------
Optional Integrations:
- Google Sheets (temporary data layer)
- Email (AgentMail) → notifications only
```

---

## 📧 Role of Email (AgentMail)

**Provider:** https://agentmail.to

Email is used as a **secondary communication layer** for:

### ✅ Use Cases

* User notifications (e.g., approvals, alerts)
* Multi-recipient visibility (HR, manager, employee)
* Activity summaries / logs
* External-style communication simulation

### ❌ Not Used For

* Core agent communication
* Real-time workflows
* System state management
* Task orchestration

> If email fails or is delayed, the system must still function normally.

---

## 📮 Identity Strategy (Two-Inbox Model)

| Inbox Email                  | Purpose                            |
| :--------------------------- | :--------------------------------- |
| `system-bavans@agentmail.to` | App/system-generated notifications |
| `agents-alpha@agentmail.to`  | Agent-triggered notifications      |

### Display Names

Dynamic display names simulate multiple senders:

* "HR Portal"
* "Auth System"
* "Agent 01"
* "Coordinator"

---

## ⚙️ Email Handling Strategy

### 1. Outgoing Emails

Triggered by:

* system events (e.g., leave approved)
* agent actions (e.g., task completed)

```javascript
async function notifySystem(appLabel, recipient, subject, body) {
  await agentMail.send("system-bavans@agentmail.to", {
    to: recipient,
    subject: `[Bavans] ${subject}`,
    text: body,
    labels: [appLabel]
  });
}
```

---

### 2. Incoming Emails (Limited Use)

Only used when necessary:

* optional triggers
* external-style interactions

Handled by a **single Email Gateway Agent**:

* reads inbox
* validates messages
* converts → internal events

---

## 🤖 Email Gateway Agent (Lightweight Broker)

A single agent responsible for:

### Responsibilities

* Sending emails
* Polling inbox (if needed)
* Converting email → internal event
* Formatting outgoing messages

### Non-Responsibilities

* No business logic
* No orchestration
* No state management

> This agent acts as a **bridge**, not a core system component.

---

## 🧩 Labels (Tags)

Used for categorization only (not routing logic).

Examples:

* `app-auth`
* `app-leave`
* `agent-01`

> ⚠️ Labels are **not reliable enough** to be the sole routing mechanism.

---

## ⚡ Core Communication (Primary System)

All critical workflows use a **local event system**, not email.

Example:

```javascript
eventBus.emit("leave.requested", data);

eventBus.on("leave.requested", (payload) => {
  // agent logic here
});
```

---

## 📊 Data Layer (Temporary)

Current:

* Google Sheets (simple storage)

Limitations:

* no concurrency control
* API limits
* not suitable for scaling

---

## 🚦 Future Backend Plan

A lightweight Node.js backend will be introduced to:

* centralize API access
* manage Google Sheets safely
* handle email sending
* provide event orchestration
* enable future database migration

### Future Architecture

```text
Electron Apps / Agents
        ↓
   Node Backend (API Layer)
     ↙        ↘
Google Sheets   Email Service
```

---

## 🔐 Security

* API keys stored in `.env`
* Only accessed in Electron Main process
* Renderer communicates via IPC
* `.env` must be in `.gitignore`

---

## 📈 Usage Limits (AgentMail Free Tier)

* 100 emails/day
* 3,000 emails/month
* 3 inboxes max

### Strategy

* avoid agent-to-agent email chatter
* batch notifications when possible
* prioritize important messages

---

## 🧭 Design Principles

1. **Local-first**

   * System works without internet (except integrations)

2. **Email is optional**

   * Never required for core functionality

3. **Agents > Infrastructure**

   * focus on agent behavior, not tooling

4. **Replaceable integrations**

   * Sheets and Email can be swapped later

5. **Event-driven core**

   * internal communication must be fast and reliable

---

## 🏁 Summary

This system is designed as a:

> **Local AI-assisted workspace with optional external communication layers**

Email enhances:

* visibility
* professionalism
* user experience

But the system fundamentally relies on:

* local execution
* agent coordination
* event-driven architecture

---

**Note:**
This design intentionally avoids over-engineering infrastructure during early development, while ensuring a smooth transition to a proper backend in future iterations.
