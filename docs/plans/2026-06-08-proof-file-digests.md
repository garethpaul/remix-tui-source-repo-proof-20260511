# Proof File Digests

## Status: Completed

## Context

`remix-tui-source-repo-proof-20260511` keeps a tiny source proof under
`poe-source/` and validates file presence, local links, metadata, security
policy, and `GameLogic.runDemo()`. The manifest did not pin the bytes of the
HTML, JavaScript, and CSS files, so a proof source rewrite could keep the same
file list while changing contents.

## Objectives

- Keep validation dependency-free.
- Record SHA-256 digests for non-manifest proof files.
- Fail when the manifest digest list is incomplete, stale, or includes files
  outside the source proof.
- Preserve the existing smoke execution and security policy checks.

## Work Completed

- Added `fileDigests` to `poe-source/PACKAGE_MANIFEST.json`.
- Extended `scripts/check-proof-source.js` to validate SHA-256 hex digests for
  non-manifest proof files.
- Added this completed plan under `docs/plans/`.
- Updated README, VISION, and CHANGES notes for digest validation.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `make verify`
- `git diff --check`
