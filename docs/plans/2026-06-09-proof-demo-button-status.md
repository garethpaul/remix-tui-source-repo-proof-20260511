# Proof Demo Button Status

## Status: Completed

## Context

The proof page includes demo action buttons and a status live region, but the
checked-in script only exposed a static proof summary. Clicking the buttons did
not update visible status text, which made the demo controls inert even though
the markup advertised actions.

## Objectives

- Keep the proof script dependency-free and safe to run in the Node smoke VM.
- Wire demo action buttons to the status live region in browser contexts.
- Expose deterministic status text for each checked-in demo action.
- Refresh the manifest digest for the changed JavaScript proof file.

## Work Completed

- Added `GameLogic.statusForAction(action)` for action-specific status text.
- Added `GameLogic.bindDemoActions(document)` and browser guarded initialization.
- Extended `scripts/check-proof-source.js` to validate action status text and
  click-handler updates with a fake document.
- Updated the JavaScript SHA-256 digest in `PACKAGE_MANIFEST.json`.
- Updated README, VISION, and CHANGES notes for the demo button status guard.

## Verification

- `node scripts/check-proof-source.js`
- `make lint`
- `make check`
- `make verify`
- `git diff --check`
