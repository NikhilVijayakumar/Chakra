---
type: Architecture
title: Chakra architecture
description: Process boundaries and Prana and Astra responsibilities.
status: draft
tags: [electron, react, astra, prana, mvvm]
---

# Responsibilities

Electron main owns desktop lifecycle and privileged operations (virtual drive, git, SSH, SQLite). React renderer presents UI. Prana supplies the virtual drive, services and runtime; Astra supplies the design system, MVVM and state primitives. Shared defects are fixed in the owning dependency, not worked around here.

See `docs/architecture/` for MVVM, repository, state, theming and localization patterns.
