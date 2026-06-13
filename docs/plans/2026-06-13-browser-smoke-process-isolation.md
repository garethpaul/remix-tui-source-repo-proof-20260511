# Browser smoke process isolation

## Status: Completed

## Context

PR #2 pull-request run `27447402443` failed only on Node 20 because one of five
sequential hosted Chrome launches exceeded the 15-second process timeout. The
same exact-head push job and pull-request Node 24 job passed. All launches reuse
one Chrome profile, which can retain process locks and makes cold-start timing
more fragile.

## Requirements

- Give every Chrome invocation a unique temporary profile directory.
- Raise the bounded per-process timeout to 30 seconds while preserving the
  existing five-minute hosted job timeout.
- Preserve both proof interactions, desktop/mobile screenshots, blank-page
  comparisons, loopback-only serving, and dependency-free execution.
- Add static/helper contracts, hostile mutations, completed local validation,
  and exact-head hosted evidence.

## Verification

## Work completed

- Added a deterministic profile path for each Chrome invocation and removed
  the shared profile directory.
- Raised the bounded Chrome process timeout from 15 to 30 seconds while
  preserving the five-minute hosted job timeout.
- Added helper/static contracts and documentation for the isolation boundary.

## Verification completed

- `node scripts/test-browser-smoke.js`, repeated
  `CHROME_BIN=google-chrome node scripts/smoke-browser.js`, and `make check`
  passed locally.
- Node syntax checks, workflow validation, `git diff --check`, artifact scans,
  and secret scans passed.
- Six hostile mutations covering shared profiles, profile reuse, the timeout,
  helper coverage, documentation, and plan status were rejected.
