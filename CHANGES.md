# Changes

## 2026-06-09

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
