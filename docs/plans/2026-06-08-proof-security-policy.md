# Proof Security Policy

## Status: Completed

## Context

`remix-tui-source-repo-proof-20260511` preserves a tiny generated browser
source proof. The existing checker validates manifest metadata, completed
plans, local asset links, document metadata, and `GameLogic.runDemo()`, but the
proof did not declare a browser security policy.

## Objectives

- Keep the proof source dependency-free and local-only.
- Declare a self-only Content Security Policy in the HTML.
- Record the expected security policy in the proof manifest.
- Validate the policy from `make check`.
- Keep the existing manifest, local-link, docs-plan, and smoke execution checks
  intact.

## Work Completed

- Added a Content Security Policy meta tag to `poe-source/index.html`.
- Added `securityPolicy` to `poe-source/PACKAGE_MANIFEST.json`.
- Extended `scripts/check-proof-source.js` to validate the policy in both
  places.
- Updated README, VISION, and CHANGES.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `make verify`
- `git diff --check`

## Follow-Up Candidates

- Add a browser-level smoke test if the proof grows beyond static markup.
- Document generator or prompt lineage if this proof is regenerated.
