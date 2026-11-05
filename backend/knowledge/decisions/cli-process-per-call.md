---
type: Decision
title: Backend logic lives in a Python CLI called once per operation
description: Why data, authentication and Google Sheets access sit behind a CLI with a JSON stdio contract instead of inside each Electron app.
status: stable
tags: [cli, architecture, sqlite, sheets]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-05T00:00:00Z }
---

# Context

Several desktop apps share a splash, authentication, a SQLite cache and Google Sheets content. That logic and its secrets need one owner and one way to be consumed, across Windows and Linux.

# Decision

A Python CLI owns all of it. Callers start one process per operation, send one JSON request on standard input and read one JSON envelope from standard output (see [Chakra CLI contract](../concepts/cli-contract.md)). The Electron side only locates the executable by a path the user configures, and checks an equal `apiVersion` before using it.

Google Sheets is the source of content and SQLite is a disposable cache with no state of record. Local updates, such as a password reset, stay pending until the next sync pushes them. They are lost if the push fails permanently or the cache is deleted.

# Alternatives considered

- Long-lived local daemon: lower latency and push events, but adds lifecycle, ports, inter-process authentication and more failure modes.
- Logic kept in TypeScript with the CLI only for storage: every app still carries authentication and Sheets code and secrets.
- CLI bundled inside the npm package: zero configuration, but per-OS packaging, size, and it removes configuring the CLI from the UI.

# Consequences

Apps stay thin and secrets stay in one place. The CLI must be built and distributed per OS, and each call pays process start time: about 0.65 s for a login with the one-file build on Linux, and the one-folder build starts about three times faster. Reconsider a daemon behind the same client interface if call latency becomes unacceptable, or reconsider bundling if distribution proves unworkable.
