---
type: Concept
title: Library and CLI split
description: Chakra is a reusable base; the UI library owns presentation and the CLI owns data, credentials and logic.
status: draft
tags: [architecture, library, cli]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-02T00:00:00Z }
---

# Definition

**Chakra UI** is an Electron library providing splash, authentication and CLI configuration. The **Chakra CLI** is a Python executable that owns the SQLite cache, Google Sheets sync, authentication, one-time-code email and per-app feature access.

# Rules

- A consuming app configures only the CLI location, from the UI.
- Google Sheets is the source of content. SQLite is a disposable cache with no state of record.
- A local edit (create, update, delete, password reset) is kept in the cache as dirty and pushed at the next sync. It is not recovered if the push never succeeds or the cache is deleted; everything else is rebuilt from the sheet.
- A consuming app has no database of its own. It reads and writes content only through the library.
- Each app sees only the features the sheet grants it, and only if the sheet marks the app enabled.
