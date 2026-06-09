# Proof Status Live Region

## Status: Completed

## Context

`poe-source/index.html` includes a visible status message for the Repo Crystal
Rally proof page. The source validator checked document metadata, local assets,
digests, CSP, path containment, and demo execution, but it did not require the
status message to be exposed as a polite live region for assistive technology.

## Objectives

- Keep the static proof dependency-free.
- Mark the proof page status message as a polite live region.
- Update the manifest digest for the changed HTML bytes.
- Add deterministic validator coverage for the status live-region contract.

## Work Completed

- Added `role="status"` and `aria-live="polite"` to the proof HTML status
  message.
- Updated the `index.html` SHA-256 digest in `PACKAGE_MANIFEST.json`.
- Extended `scripts/check-proof-source.js` to require the live-region
  attributes.
- Updated README, VISION, and CHANGES notes for the accessibility guard.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `make verify`
- `git diff --check`
