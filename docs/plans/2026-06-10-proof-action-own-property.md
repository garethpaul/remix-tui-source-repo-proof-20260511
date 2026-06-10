# Proof Action Own-Property Guard

## Status: Completed

## Context

`GameLogic.statusForAction(action)` read action names from a regular object.
Names inherited from `Object.prototype`, such as `constructor` or `toString`,
could therefore return a function instead of the documented fallback text.

## Objectives

- Return configured text for the checked-in `charge` and `release` actions.
- Use the documented proof summary for unknown and inherited property names.
- Keep the proof implementation dependency-free and browser-compatible.

## Work Completed

- Restricted action status lookup to own properties of the checked-in status
  map.
- Added adversarial smoke checks for `constructor`, `toString`, and
  `__proto__` action names.
- Updated the proof manifest digest and maintenance documentation.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `git diff --check`
