---
title: Bound Chrome Discovery Probes
date: 2026-06-17
type: implementation-plan
status: in-progress
---

# Bound Chrome Discovery Probes

## Context

The real-browser proof gives each launched Chrome process a 30-second timeout,
but `findChrome()` probes every candidate with a synchronous `--version`
command that has no bound. A configured `CHROME_BIN`, wrapper, or shadowed
binary can therefore stall `make check` before the isolated browser runner and
its timeout are reached.

## Goal

Bound every Chrome discovery probe while preserving candidate fallback,
real-browser interaction coverage, responsive layout checks, screenshot
validation, and process isolation.

## Requirements

1. Every synchronous Chrome `--version` probe must have a short, finite,
   positive timeout that is lower than the existing 30-second browser
   execution bound.
2. Discovery probes must use `SIGKILL` when the timeout expires so a hostile
   wrapper cannot ignore termination and retain the synchronous caller.
3. A timed-out or otherwise failed candidate must be skipped so discovery can
   continue to the next candidate.
4. A successful candidate must still be returned unchanged.
5. Focused tests must prove the timeout and kill-signal options are supplied,
   a timed-out first candidate falls through, and a later successful candidate
   is selected.
6. Static contracts and project guidance must preserve the bounded-discovery
   invariant.
7. Existing Chrome launch, responsive layout, action interaction, screenshot,
   cleanup, and repository/external-directory gates must remain green.

## Implementation Units

### Chrome discovery

- `scripts/smoke-browser.js`
  - Give `spawnSync` discovery probes a named timeout and non-ignorable kill
    signal.
  - Keep the current ordered candidate fallback and success criteria.
  - Export only the narrow seam needed for deterministic discovery tests.

### Regression and static contracts

- `scripts/test-browser-smoke.js`
  - Add deterministic fake-probe coverage for timeout forwarding, failed
    candidate fallback, and later-candidate selection.
- `scripts/check-proof-source.js`
  - Register this plan and require the discovery timeout and regression
    fixture to remain present.

### Documentation

- `README.md`
  - Document that both Chrome discovery and browser execution are bounded.
- `CHANGES.md`
  - Record the reliability improvement.

## Validation

- Run the focused browser contract test and source checker on supported Node
  versions.
- Run `make check` from the repository root and through the absolute Makefile
  path from an external directory, including hostile `ROOT` input.
- Exercise hostile mutations that remove the probe timeout or kill signal,
  stop forwarding either option, remove fallback coverage, or weaken the
  completed plan and README contracts.
- Run the real Chrome desktop/mobile interaction and screenshot gate.
- Audit the exact diff, generated artifacts, credentials, dependency/workflow
  changes, file modes, and upstream equality before shipment.

## Risks And Boundaries

- The discovery timeout must be long enough for ordinary local and hosted
  `--version` probes while remaining far below the 30-second browser execution
  bound.
- The change does not add browser engines, dependencies, or package metadata.
- The proof remains a static local artifact validated with installed Chrome;
  cross-browser rendering remains outside this change.
