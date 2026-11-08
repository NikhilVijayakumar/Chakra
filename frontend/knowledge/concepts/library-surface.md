---
type: Concept
title: Chakra UI library surface
description: What the UI library exports and how its process boundaries work.
status: draft
tags: [electron, library, ipc]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-02T00:00:00Z }
---

# Surface

Three entry points: a main-process registration function, a preload bridge, and renderer components (a gate that sequences splash, boot checks and login, plus standalone CLI-configuration, login, forgot-password and sync components). The library does not set a theme; the consuming app provides one.

The CLI-configuration component is meant to be embedded in the consuming app's own settings screen: it saves the path and verifies that the CLI is reachable, compatible and healthy. The app keeps no separate copy of the setting.

# Boundaries

- The renderer reaches the CLI only through a fixed set of named operations; it cannot run arbitrary commands.
- The app identity sent to the CLI is set in the main process, never by the renderer.
- The CLI is started without a shell, once per call. Secrets go to it on standard input only and never appear in arguments, logs or displayed errors.
- The only state the UI keeps is the CLI location and its last verification.
