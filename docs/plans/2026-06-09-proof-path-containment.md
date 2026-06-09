# Proof Path Containment

## Status: Completed

## Context

The proof validator checked manifest membership, local HTML asset links,
digests, and the self-only security policy. The remaining source-boundary risk
was implicit path handling: manifest file entries and local HTML asset
references should never resolve outside `poe-source`, even if a future edit
adds parent-directory segments.

## Objectives

- Keep the proof artifact files and existing SHA-256 digests unchanged.
- Resolve manifest entries and HTML asset links through one source-root helper.
- Reject local proof paths that escape `poe-source`.
- Preserve the dependency-free Node validation workflow.

## Work Completed

- Added source-root path helpers to `scripts/check-proof-source.js`.
- Rejected manifest file entries that resolve outside `poe-source`.
- Rejected local HTML asset references that resolve outside `poe-source`.
- Updated README, SECURITY, VISION, and CHANGES notes for path containment.

## Verification

- `node scripts/check-proof-source.js`
- `make check`
- `make verify`
- `git diff --check`
