# Proof Button Type Guard

## Status: Completed

## Context

The proof page exposes two demo action buttons for the static Repo Crystal
Rally source bundle. They were outside a form, so the browser default button
type did not currently submit anything, but the markup should stay robust if a
future proof wrapper introduces form semantics around the controls.

## Objectives

- Keep the visible proof page unchanged.
- Mark demo action controls as explicit non-submit buttons.
- Add deterministic source validation so future demo action buttons keep the
  same behavior.
- Refresh the proof manifest digest for the edited HTML.

## Work Completed

- Added `type="button"` to both `data-demo-action` buttons in
  `poe-source/index.html`.
- Extended `scripts/check-proof-source.js` to require demo action buttons and
  reject missing `type="button"` attributes.
- Refreshed the HTML SHA-256 digest in `poe-source/PACKAGE_MANIFEST.json`.
- Updated README, VISION, and CHANGES notes for the proof button type guard.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `google-chrome --headless --disable-gpu --no-sandbox --screenshot=/tmp/remix-tui-proof-button-type.png --window-size=800,600 file:///home/gjones/code/private/repos/garethpaul/remix-tui-source-repo-proof-20260511/poe-source/index.html`
- `git diff --check`
