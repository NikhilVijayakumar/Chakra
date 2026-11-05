---
type: Concept
title: Write path and two-way sync
description: How edits made through the CLI are stored, pushed to the sheet and merged with the sheet on the next sync.
status: draft
tags: [cli, sync, writes, sqlite]
generated: { by: claude-code/sonnet-5.5, at: 2026-11-05T00:00:00Z }
---

# Writable contents

The registry marks which contents can be changed. For each one it gives the id prefix, the required fields, the relations to other contents, the integer fields and the hidden fields (never returned to callers). Every cached row also carries a `sync` stamp (epoch seconds), a dirty flag and a deleted flag.

# Edits

Create, update and delete change only the cache. They set the dirty flag and a new `sync` stamp. A delete is a soft delete. Ids are generated as the prefix plus the highest existing number plus one, zero padded. Passwords are accepted as plain input, stored only as bcrypt hashes and never returned.

# Sync of one writable content

Push first. Rows that are deleted and dirty are removed from the sheet. Rows that are dirty are written, but a row already in the sheet is skipped when its stamp is not older than the local one. A dirty flag is cleared only for rows actually pushed. Then pull. A row absent locally is inserted. A row whose sheet stamp is newer replaces the local row, and if the local row had unpushed edits a conflict is recorded. A local row missing from the sheet and not dirty is soft deleted. Rows that fail validation are quarantined, not loaded.

# Durability

Unpushed edits exist only in the cache. Deleting the cache loses them; everything else is rebuilt from the sheet.
