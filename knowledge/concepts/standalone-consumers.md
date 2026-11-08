---
type: Concept
title: Standalone consumers
description: Registered application identity and user access for separate Chakra consumers.
status: draft
tags: [architecture, library, cli, authorization]
generated: { by: codex/gpt-6, at: 2026-11-08T00:00:00Z }
---

# Direction

A standalone consumer uses Chakra's authentication, cache and sync services. Chakra uses the app registry identifier and checks whether the authenticated user has access directly or through a team; the consumer does not manage the registry. Application identity and permission mapping are resolved by Chakra.
