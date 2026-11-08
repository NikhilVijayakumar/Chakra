---
type: Concept
title: Chakra CLI contract
description: How callers talk to the CLI and what it guarantees.
status: draft
tags: [cli, contract, json]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-02T00:00:00Z }
---

# Contract

One process per call: `chakra <group> <command>`. The request is one JSON object on standard input and the response is one JSON envelope on standard output, `{ok, data|error, apiVersion}`. A failure exits non-zero. Error messages never contain passwords, one-time codes, tokens or credentials.

# Content registry

The mapping from sheet tabs to cache tables, which content needs which feature, and which columns may be pushed back to the sheet is data in a single registry file. A change to the sheet layout is a change to that file.

# Sync

A sync pushes local edits for each content and then pulls its sheet (see [Write path and two-way sync](write-path.md)); rows that fail validation go to [Quarantine](quarantine.md). A failed content keeps its previous rows and is reported as not synced. The intended app-aware login contract uses apiVersion 3; consumers must upgrade Chakra UI and CLI together. Earlier releases use apiVersion 2. Sync status is computed from cache metadata and never contacts Google.
