# Proof Button Focus Visible

## Status: Completed

## Context

The proof page includes demo action buttons and already requires them to be
explicit `type="button"` controls. The default browser focus ring is usually
available, but the proof CSS did not make keyboard focus visibility part of the
source contract.

## Objectives

- Add an explicit visible keyboard focus style for proof demo buttons.
- Keep the focus style dependency-free and local to the proof CSS.
- Extend the static validator so future CSS changes cannot remove the visible
  `button:focus-visible` outline.
- Refresh the manifest digest for the changed CSS proof file.

## Work Completed

- Added a `button:focus-visible` rule with a visible outline and offset.
- Extended `scripts/check-proof-source.js` to require the focus-visible rule,
  visible outline, and outline offset.
- Updated the CSS SHA-256 digest in `PACKAGE_MANIFEST.json`.
- Updated README, VISION, and CHANGES notes for the keyboard focus guard.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `make verify`
- `git diff --check`
