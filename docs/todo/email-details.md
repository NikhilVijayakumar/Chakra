# 📧 AgentMail Integration & Email Architecture (Electron-First)

## 🛡️ Core Principle

> **Email is an asynchronous visibility layer — not part of core system logic.**

The Electron application is **local-first and fully functional without email**.
If the email service fails or is delayed, **no workflow should break**.

---

## 🧠 System Role of Email

Email is used strictly for:

### ✅ Supported Use Cases

* User notifications (approvals, alerts, summaries)
* Multi-recipient visibility (e.g., HR + Manager + Employee)
* Activity logs (human-readable)
* External-style communication simulation

### ❌ Not Used For

* Agent-to-agent communication
* Real-time workflows
* Task orchestration
* System state or data storage

---

## 🏗️ High-Level Architecture

```text
Human
  ↕
Renderer (React/Vite UI)
  ↕ IPC
Electron Main Process (Core System)
  ↕
Agent Layer + Event Bus  ← (PRIMARY SYSTEM)
  ↕
Notification Layer
  ↕
Email Gateway (AgentMail)
```

---

## ⚡ Event-Driven Flow

```text
1. Internal Event Triggered
   ↓
2. Notification Layer Evaluates Event
   ↓
3. Email Gateway Agent Handles Delivery
   ↓
4. AgentMail API Sends Email
```

---

## 🔔 Notification Layer (New Core Abstraction)

Instead of sending emails directly, the system uses a **Notification Layer**.

### Example

```javascript
notify({
  type: "task.completed",
  actor: "agent.coordinator",
  recipients: ["user@example.com"],
  channels: ["email"],
  data: {
    status: "Completed",
    details: "Project Alpha sync finished successfully."
  }
});
```

### Responsibilities

* Normalize events
* Decide delivery channels (email, UI, logs)
* Prevent duplicate/spam notifications
* Map event types → templates

---

## 🤖 Email Gateway Agent

A **lightweight service in the Main process** responsible for all email operations.

### Responsibilities

* Send emails via AgentMail SDK
* Load and compile templates
* Inject dynamic data
* Handle inbox selection (system vs agent)

### Non-Responsibilities

* ❌ No business logic
* ❌ No workflow orchestration
* ❌ No state management

> This is a **bridge layer**, not a core system component.

---

## 📂 Directory Structure

```plaintext
/src
  /main
    /services
      ├── emailService.js        # AgentMail SDK communication
      ├── notificationService.js # NEW: event → notification logic
    /templates
      ├── base-layout.hbs
      ├── alert.hbs
      └── task-summary.hbs
```

---

## ⚙️ Template Strategy

### Engine

* Handlebars / Mustache

### Rules

* All CSS must be **inline** (email client compatibility)
* Templates are **local assets** (no external dependency)
* Unlimited templates supported

### Mapping (Event → Template)

```javascript
const templateMap = {
  "task.completed": "task-summary",
  "leave.approved": "alert"
};
```

---

## 📮 Identity Strategy (Two-Inbox Model)

| Inbox                        | Purpose                  |
| ---------------------------- | ------------------------ |
| `system-bavans@agentmail.to` | System/app notifications |
| `agents-alpha@agentmail.to`  | Agent-triggered messages |

### Dynamic Display Names

Simulate multiple senders:

* "HR Bot"
* "System Admin"
* "Agent 01"
* "Coordinator"

---

## 🚀 Implementation Flow

### 1. Trigger Notification

```javascript
eventBus.emit("task.completed", payload);
```

---

### 2. Notification Service

```javascript
eventBus.on("task.completed", (data) => {
  notify({
    type: "task.completed",
    recipients: ["user@example.com"],
    channels: ["email"],
    data
  });
});
```

---

### 3. Email Dispatch

```javascript
await emailService.send({
  template: "task-summary",
  to: "user@example.com",
  data
});
```

---

## 🔌 Electron Integration (IPC Bridge)

### Main Process

```javascript
import { ipcMain } from 'electron';
import { notify } from './services/notificationService';

ipcMain.handle('notify', async (_, payload) => {
  return await notify(payload);
});
```

---

### Renderer / Agent Trigger

```javascript
await window.electronAPI.notify({
  type: "task.completed",
  recipients: ["user@example.com"],
  channels: ["email"],
  data: { status: "Success" }
});
```

---

## 🔐 Security Model

* API keys stored in `.env`
* Only accessible in **Main process**
* Renderer never accesses AgentMail directly
* `.env` must be in `.gitignore`

```plaintext
.env
node_modules/
dist/
```

---

## 📊 Rate Limits (Free Tier)

* 100 emails/day
* 3,000 emails/month
* Max 3 inboxes

### Optimization Strategies

* Batch non-urgent notifications
* Avoid agent-to-agent email chatter
* Deduplicate repeated events

---

## ⚠️ Reliability Considerations

### 1. Idempotency

* Track message IDs to avoid duplicates

### 2. Retry Logic

* Retry failed sends (with backoff)

### 3. Failure Handling

* Log failures locally
* Do not block main workflow

---

## 📊 Local Logging (Recommended)

Maintain a local log (JSON/SQLite):

Track:

* notifications sent
* failures
* timestamps
* agent actions

---

## 🚦 Future Backend Integration

A Node.js backend will later:

* centralize email handling
* manage Google Sheets safely
* provide event orchestration
* enable database migration

### Future Flow

```text
Electron → Node API → Email / Database
```

---

## 🧭 Design Principles

1. **Local-first**
2. **Email is optional**
3. **Event-driven core**
4. **Agents > infrastructure**
5. **Replaceable integrations**

---

## 🏁 Summary

This system is a:

> **Local AI workspace with a structured notification system and optional email layer**

Email enhances:

* visibility
* professionalism
* user experience

But the system fundamentally relies on:

* local execution
* event-driven agents
* internal coordination

---

**Note:**
This design avoids over-engineering while ensuring smooth migration to a backend in future iterations.

# 📧 AgentMail Integration & Email Architecture (Electron + TypeScript)

## 🛡️ Core Principle

> **Email is an asynchronous visibility layer — not part of core system logic.**

The Electron app is **local-first**. Email enhances UX but must never be required for system functionality.

---

## 🧠 Architecture Overview

```text
Human
  ↕
Renderer (React/Vite)
  ↕ IPC
Electron Main (TypeScript)
  ↕
Event Bus (Typed)
  ↕
Notification Layer (Typed)
  ↕
Email Gateway (AgentMail)
```

---

## ⚡ Type-Safe Event System

### Define Event Types

```ts
// types/events.ts
export type EventMap = {
  "task.completed": {
    agent: string;
    status: string;
    details: string;
  };

  "leave.approved": {
    employee: string;
    approver: string;
    date: string;
  };
};
```

---

### Typed Event Bus

```ts
// services/eventBus.ts
type EventHandler<T> = (payload: T) => void;

class EventBus {
  private listeners: {
    [K in keyof EventMap]?: EventHandler<EventMap[K]>[];
  } = {};

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    this.listeners[event]?.forEach((handler) => handler(payload));
  }
}

export const eventBus = new EventBus();
```

---

## 🔔 Notification Layer (Type-Safe)

### Notification Payload Type

```ts
// types/notification.ts
export type NotificationType = keyof EventMap;

export type NotificationPayload<T extends NotificationType> = {
  type: T;
  recipients: string[];
  channels: ("email" | "ui" | "log")[];
  data: EventMap[T];
};
```

---

### Notification Service

```ts
// services/notificationService.ts
import { NotificationPayload } from "../types/notification";
import { sendEmail } from "./emailService";

export async function notify<T extends keyof EventMap>(
  payload: NotificationPayload<T>
) {
  const { type, channels, recipients, data } = payload;

  if (channels.includes("email")) {
    await sendEmail({
      template: mapTemplate(type),
      to: recipients,
      data,
    });
  }

  // Future: UI, logs, etc.
}
```

---

### Template Mapping (Type-Safe)

```ts
// services/templateMap.ts
import { NotificationType } from "../types/notification";

export const templateMap: Record<NotificationType, string> = {
  "task.completed": "task-summary",
  "leave.approved": "alert",
};

export function mapTemplate(type: NotificationType) {
  return templateMap[type];
}
```

---

## 📧 Email Service (Typed)

```ts
// services/emailService.ts
type EmailPayload<T> = {
  template: string;
  to: string[];
  data: T;
};

export async function sendEmail<T>({
  template,
  to,
  data,
}: EmailPayload<T>) {
  const html = await renderTemplate(template, data);

  await agentMail.send("agents-alpha@agentmail.to", {
    to,
    subject: "[Bavans] Notification",
    html,
  });
}
```

---

## 🧩 Template Rendering (Typed)

```ts
// services/templateRenderer.ts
import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";

export async function renderTemplate<T>(
  templateName: string,
  data: T
): Promise<string> {
  const filePath = path.join(
    __dirname,
    "../templates",
    `${templateName}.hbs`
  );

  const source = await fs.readFile(filePath, "utf-8");
  const compiled = handlebars.compile<T>(source);

  return compiled(data);
}
```

---

## 🔌 Electron IPC (Type-Safe Bridge)

### Define IPC Types

```ts
// types/ipc.ts
export type NotifyIPC = {
  type: keyof EventMap;
  recipients: string[];
  channels: ("email" | "ui" | "log")[];
  data: any;
};
```

---

### Main Process

```ts
// main/ipc.ts
import { ipcMain } from "electron";
import { notify } from "../services/notificationService";

ipcMain.handle("notify", async (_, payload: NotifyIPC) => {
  return await notify(payload);
});
```

---

### Renderer

```ts
// preload.ts
contextBridge.exposeInMainWorld("electronAPI", {
  notify: (payload: NotifyIPC) => ipcRenderer.invoke("notify", payload),
});
```

---

## 🔐 Environment & Security

```env
AGENTMAIL_API_KEY=your_api_key
SYSTEM_INBOX_ID=xxx
AGENT_INBOX_ID=yyy
```

* Only accessed in Main process
* Never exposed to Renderer
* `.env` must be ignored

---

## 📊 Rate Limits

* 100 emails/day
* 3,000/month

### Strategy

* Batch low-priority notifications
* Deduplicate repeated events

---

## ⚠️ Reliability Enhancements

### Idempotency

```ts
const processed = new Set<string>();

function isDuplicate(id: string) {
  if (processed.has(id)) return true;
  processed.add(id);
  return false;
}
```

---

### Retry Logic (Basic)

```ts
async function retry<T>(fn: () => Promise<T>, retries = 3) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    return retry(fn, retries - 1);
  }
}
```

---

## 🧭 Design Principles

1. Type-safe event-driven system
2. Email is optional (non-blocking)
3. Local-first execution
4. Replaceable integrations
5. Strong separation of concerns

---

## 🏁 Summary

This system is a:

> **Type-safe, event-driven notification architecture for a local AI workspace**

Email is:

* structured
* controlled
* optional

Core system remains:

* fast
* local
* reliable

