# Changes

## 2026-06-13

- Required both proof and blank comparison screenshots to have recognized
  PNG/IHDR headers and exact viewport dimensions before digest comparison.
- Made responsive browser geometry independent of headless Chrome outer-window
  decoration by applying each declared viewport directly to the smoke iframe.
- Made recursive browser verification independent of the caller's working
  directory.
- Added real-Chrome desktop/mobile geometry checks for visible status and
  action controls, 44-pixel button heights, and non-overlapping buttons.
- Isolated every Chrome launch in its own profile and raised the bounded
  per-process timeout to 30 seconds without reducing interaction or screenshot
  coverage.
- Preserved isolated Chrome profiles and the 30-second bound in static and
  helper contracts.

## 2026-06-12

- Added a dependency-free real-browser Chrome smoke for both proof actions and
  nonblank desktop/mobile screenshots.
- Added dependency-free real-path and regular-file validation for proof
  manifest entries and HTML-linked assets.
- Rejected file and parent-directory symlinks and required `generatedAt` to be
  a real canonical calendar date.

## 2026-06-10

- Restricted demo action status lookups to checked-in own properties and added
  adversarial coverage for inherited object property names.
- Guarded demo action binding against malformed document and button objects.
- Added pinned, credential-free, least-privilege GitHub Actions validation on
  Node.js 20 and 24 for pushes, pull requests, and manual dispatches.
- Made the Makefile validation entrypoint independent of the caller's current
  directory.
- Added fail-closed exact checks for the hosted workflow and both completed CI
  plans.
- Added local secret/editor exclusions and fail-closed tracked-metadata checks.

## 2026-06-09

- Associated proof demo buttons with the status live region and added
  validator coverage for `aria-controls`.
- Wired proof demo buttons to update the status live region and added validator
  coverage for action status text and click-handler behavior.
- Added an explicit visible `button:focus-visible` style and validator guard
  for proof demo keyboard focus.
- Required the proof status live region to be atomic and refreshed the
  validator coverage plus manifest digest.
- Added explicit non-submit types to proof demo action buttons and validator
  coverage for that markup contract.
- Marked the proof page status message as a polite live region and added
  validator coverage for that accessibility contract.
- Added source-root containment checks so proof manifest entries and HTML asset
  references cannot escape `poe-source`.

## 2026-06-08

- Added manifest SHA-256 digest validation for the proof HTML, JavaScript, and
  CSS files.
- Added a self-only Content Security Policy to the proof source and manifest.
- Added a dependency-free source proof smoke check for the package manifest,
  local HTML asset links, document metadata, and `GameLogic.runDemo()`.
- Added missing `lang`, `charset`, and viewport metadata to the proof HTML.
- Documented `make verify` and `make check` as repository verification commands.
- Added proof manifest metadata for demo name, source root, entrypoint,
  generated date, and expected `GameLogic.runDemo()` output.
- Added canonical `docs/plans` coverage and made the proof source validator
  require completed plans.
