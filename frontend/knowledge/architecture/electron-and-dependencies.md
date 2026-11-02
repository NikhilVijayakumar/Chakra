---
type: Architecture
title: Chakra frontend architecture
description: Electron process boundaries of the Chakra UI library.
status: draft
tags: [electron, react]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-02T00:00:00Z }
---

# Responsibilities

Electron main spawns the CLI and keeps its location; the renderer presents screens and talks to main over the preload bridge. All data, credentials and business logic are in the CLI. The library depends on React and MUI as peers and has no dependency on Prana or Astra.
