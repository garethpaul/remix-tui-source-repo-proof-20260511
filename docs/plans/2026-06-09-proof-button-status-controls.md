# Proof Button Status Controls

Status: Completed

## Context

The proof demo buttons update the visible status live region through
`GameLogic.bindDemoActions(document)`. The behavior was validated, but the
buttons did not expose their relationship to the status element in the HTML.

## Objectives

- Associate each proof demo action button with the status live region.
- Extend the dependency-free proof source validator to keep the association.
- Refresh the manifest digest for the changed HTML source.
- Document the guard in README, VISION, and CHANGES.

## Work Completed

- Added `aria-controls="status"` to both proof demo action buttons.
- Extended `scripts/check-proof-source.js` to validate the button
  `aria-controls` attribute.
- Updated the `index.html` SHA-256 digest in `PACKAGE_MANIFEST.json`.
- Updated top-level maintenance documentation for the new accessibility guard.

## Verification

- `node --check scripts/check-proof-source.js`
- `node scripts/check-proof-source.js`
- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`
