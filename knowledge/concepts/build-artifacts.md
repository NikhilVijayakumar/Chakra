---
type: Concept
title: Build artifacts
description: One build script produces either a release (CLI folder, Windows installer, npm tarball) or a dev setup (CLI folder, in-place library, launcher).
status: draft
tags: [build, release, cli, library]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-08T00:00:00Z }
---

# Definition

`scripts/build.py` builds Chakra for the machine it runs on. A release produces the two things consuming apps need: the CLI, installed separately, and the UI library, installed as an npm tarball. A dev build produces the same CLI folder plus the library built in place, so the reference app can run against the working tree.

# Rules

- A release writes `Chakra-CLI/` (executable, runtime files, launcher, optional `config/.env`, `build.json`), the npm tarball, and on Windows a per-user installer.
- A dev build writes the CLI folder and `frontend/dist-lib`, plus a launcher for the reference app; it writes no installer or tarball.
- The installer keeps the CLI's settings and cache in the user's application data (`%APPDATA%\chakra` on Windows, `CHAKRA_HOME` overrides), so upgrades and uninstall do not lose them.
- Output locations come from the command line, then the machine's environment or `.env`, then `dist/`; no machine-specific path is committed.
- Built outputs are never committed. An app takes the tarball and points at the CLI from its settings screen.
