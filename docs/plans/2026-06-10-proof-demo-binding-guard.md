# Proof Demo Binding Guard

## Status: Completed

## Context

The checked-in proof source exposes `GameLogic.bindDemoActions(document)` so
the static demo buttons can update the status live region. The happy path was
covered, but malformed host documents or button collections could still throw
before the proof source finished loading.

## Objectives

- Ignore missing or malformed document references.
- Ignore document query failures and malformed button lists.
- Ignore button entries without callable event registration.
- Preserve the existing charge and release status updates.

## Work Completed

- Added guards around document access, button-list access, and button listener
  registration in `poe-source/game.js`.
- Kept click handlers resilient when `button.dataset` is missing or throws.
- Extended `scripts/check-proof-source.js` smoke execution for malformed
  binding inputs.
- Updated the proof manifest digest, README, VISION, CHANGES, and this
  completed plan.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `git diff --check`
