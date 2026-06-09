# Proof Status Atomic Live Region

## Status: Completed

## Context

The proof page status message is exposed as a polite live region, but the
validator did not require atomic announcements. A generated proof status should
continue to announce the complete status phrase if future edits update the
message dynamically.

## Objectives

- Keep the visible proof page unchanged.
- Mark the status live region with `aria-atomic="true"`.
- Refresh the manifest digest for the changed HTML bytes.
- Add deterministic validator coverage for the atomic live-region contract.

## Work Completed

- Added `aria-atomic="true"` to the proof HTML status message.
- Updated the `index.html` SHA-256 digest in `PACKAGE_MANIFEST.json`.
- Extended `scripts/check-proof-source.js` to require the atomic polite status
  live-region attributes.
- Updated README, VISION, and CHANGES notes for the accessibility guard.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `make verify`
- `git diff --check`
