# Shared OpenSpec store

`chakra-planning` is the common home for specifications and changes. The frontend and backend component configs point at it. OpenSpec resolves change schemas and artifact instructions from the store, not from the component config, so select the schema explicitly (`backend`, `frontend`, `fullstack`), even when running from a component directory. All three share the intent-driven lifecycle: proposal, specs, api-contract, design, ADR, tasks.

```bash
openspec new change be-example --schema backend --store chakra-planning
openspec new change fe-example --schema frontend --store chakra-planning
openspec new change product-example --schema fullstack --store chakra-planning
```

Each change uses one schema; cross-component work uses `fullstack`, with both sides' requirements and interface contract in one change.

The store registration is per machine and contains an absolute path. On another machine, install OpenSpec and run `openspec store register <path-to-chakra>/planning`. Store files remain in the Chakra Git repository; setup must use `--no-init-git` to avoid creating a nested repository. OpenSpec stores are beta. Do not create component-local `openspec/specs/` or `openspec/changes/`, which take precedence over the store declaration.

In the scratch store test, OpenSpec's status guidance could not determine which repository implements the change and listed only the store as an allowed edit root. This monorepo's application code is in the parent Chakra repository; check the active tool's workspace permissions and the change scope before editing it. End-to-end OpenSpec apply behavior for this nested store has not yet been verified.

Run `python scripts/verify_knowledge.py knowledge`, and repeat with `backend/knowledge` and `frontend/knowledge`, to validate the three independent OKF bundles. Links from delivery artifacts may cite all affected bundles; links within a bundle remain inside that bundle or point to external URLs.

For a requirements or OpenSpec Markdown file, run `python scripts/verify_knowledge_references.py <file>`. It checks for at least one Markdown link to an existing concept in an approved bundle and reports broken knowledge links. It does not judge whether the selected concepts are sufficient or applicable; review those manually. Use links relative to the artifact file.
