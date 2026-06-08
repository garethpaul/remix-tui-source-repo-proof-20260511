# Proof Source Smoke Check

## Problem

The repository contains a generated static source proof but had no automated
check for whether the manifest, HTML links, and demo script still agree.

## TDD Evidence

1. Added `scripts/check-proof-source.js` and wired it to `make lint`.
2. Ran the checker before source fixes and confirmed it failed because
   `poe-source/index.html` lacked document language, charset, and viewport
   metadata.
3. Added the missing metadata, then reran the full verification gate.

## Verification

- `make lint`
- `make test`
- `make verify`
- `git diff --check`
