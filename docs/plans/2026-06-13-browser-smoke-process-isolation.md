# Browser smoke process isolation

status: planned

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

- Run the focused browser helper tests, repeated real-browser smoke, all Make
  gates, hostile mutations, syntax checks, diff checks, artifact scans, and
  secret scans.
