---
type: Concept
title: Quarantine
description: Where rows that fail validation or conflict during sync are held until someone resolves them.
status: draft
tags: [cli, sync, validation]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-05T00:00:00Z }
---

# Entries

A quarantine entry holds the content, the record id, a reason, details, the sheet data, the local data when relevant, a status and a creation time. The reasons are `missing_id`, `missing_required`, `invalid_relation`, `type_mismatch` and `conflict`. The statuses are `pending`, `resolved` and `rejected`. The same content, record and reason while pending update one entry.

# Resolution

Reject marks an entry rejected. Accepting the sheet version resolves a conflict (the sheet version was already applied) or forces a rejected sheet row into the cache. Applying the local version is only for conflicts and restores the local data as a new edit. Fixing supplies a corrected record that must pass validation. A scan validates cached rows and quarantines the failures without deleting them from the sheet.
