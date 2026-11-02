---
type: Product
title: Chakra product
description: Purpose and boundaries of the Chakra app installer.
status: draft
generated: { by: claude-code/sonnet-5.5, at: 2026-11-02T00:00:00Z }
tags: [product, electron]
---

# Purpose

Chakra is an Electron desktop host that installs and manages applications from git repositories into an encrypted virtual drive, with role-based access to governance repositories and SQLite-cached configuration.

# Principles

- Git-based installation into the encrypted virtual drive.
- All data (apps, governance repos, cache) lives in the encrypted mount.
- Role-based, SSH-backed governance access.
- Authentication first: the app boots only after successful login.

Feature detail lives in `docs/feature/`; promote durable facts here as concepts.
