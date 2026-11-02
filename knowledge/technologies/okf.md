---
type: Technology
title: Open Knowledge Format (OKF)
description: Google Cloud's Markdown-plus-YAML format for knowledge bundles; and how Chakra's own knowledge uses it.
tags: [okf, knowledge, format, detection]
status: draft
generated: { by: claude-code/opus-5.5, at: 2026-10-26T00:00:00Z }
resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
sources:
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: Open Knowledge Format specification v0.2
    author: team:googlecloudplatform
---

# Definition

In Chakra, **OKF** always means the Open Knowledge Format published by Google
Cloud in `GoogleCloudPlatform/knowledge-catalog` (Apache-2.0). Version 0.2 is
current; v0.1 bundles remain consumable.[^spec]

# Structure

- A **bundle** is a directory tree of Markdown files; it may be a whole
  repository or a subdirectory of one.
- Each non-reserved `.md` file is a **concept**: YAML frontmatter plus a
  Markdown body. The concept ID is its path without `.md`.
- `index.md` (directory listing) and `log.md` (dated history) are reserved
  at every level.
- Only `type` is required. `title`, `description`, `resource`, `tags` are
  recommended; `sources`, `generated`, `verified`, `status`
  (`draft | stable | deprecated`), and `stale_after` add provenance, trust,
  and lifecycle.
- A bundle **may** declare its version in the root `index.md` frontmatter:
  `okf_version: "0.2"`. This is the only frontmatter allowed in an index.

# Conformance (OKF §11)

A bundle conforms when every non-reserved `.md` file has parseable YAML
frontmatter with a non-empty `type`, and reserved files follow their
structure. Consumers must tolerate unknown types, unknown keys, missing
optional fields, broken links, and missing indexes.

# Use in this repository

Chakra's engineering knowledge is an OKF v0.2 bundle at the repository's
`knowledge/` directory. Check it before writing any OpenSpec change.
