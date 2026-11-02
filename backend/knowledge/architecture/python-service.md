---
type: Architecture
title: Chakra backend architecture
description: Role and boundaries of the Python backend service.
status: draft
tags: [python, backend]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-02T00:00:00Z }
---

# Responsibilities

The Python CLI owns the SQLite cache, Google Sheets sync, authentication and email. It is a standalone executable (PyInstaller) built per OS, with Windows as the primary target.
