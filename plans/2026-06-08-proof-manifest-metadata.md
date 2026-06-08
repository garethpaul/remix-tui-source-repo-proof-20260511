# Proof Manifest Metadata

## Status

Completed

## Context

The proof source validator checks the package manifest and executes
`GameLogic.runDemo()`, but the manifest only lists files. The proof artifact is
more inspectable if the manifest records the demo name, source root, entrypoint,
generated date, and expected demo summary that the smoke check validates.

## Objectives

- Add proof metadata to `poe-source/PACKAGE_MANIFEST.json`.
- Validate required manifest metadata in `scripts/check-proof-source.js`.
- Use the manifest's expected demo summary for the `GameLogic.runDemo()` smoke
  check.
- Update README and roadmap notes with local run and expected-output guidance.

## Verification

- `make lint`
- `make verify`
- `git diff --check`
