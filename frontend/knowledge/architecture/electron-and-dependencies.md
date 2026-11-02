---
type: Architecture
title: Chakra frontend architecture
description: Electron process boundaries and Prana and Astra responsibilities.
status: draft
tags: [electron, react, astra, prana, mvvm]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-02T00:00:00Z }
---

# Responsibilities

Electron main owns desktop lifecycle and privileged operations (virtual drive, git, SSH, SQLite cache). The React renderer presents UI and reaches main only through the preload bridge. Prana supplies the virtual drive, services and runtime; Astra supplies the design system, MVVM and state primitives. A defect in a shared capability is fixed in its owning dependency, not worked around here.

# Backend boundary

Calls to the Python backend go through a defined interface; the connection and its process lifecycle are not yet decided.
