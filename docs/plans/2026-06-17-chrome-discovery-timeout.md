# Bound Chrome Discovery Probes

## Status: Completed

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

## Work Completed

- Added a 5-second Chrome discovery timeout with `SIGKILL` while preserving the
  existing ordered candidate fallback and success criteria.
- Added deterministic regression coverage for option forwarding, a timed-out
  first candidate, later-candidate selection, and all-candidate failure.
- Added source, test, README, changelog, and completed-plan contracts without
  changing dependencies, workflows, browser interactions, or screenshots.

## Verification Completed

- Node 20.19.5 and Node 24.16.0 passed the focused browser contract and the
  real Chrome desktop/mobile interaction and screenshot smoke.
- The exact worktree and a Git-backed final-state projection passed repository
  `make check` and the absolute-Makefile gate from an external directory with
  hostile `ROOT=/tmp` on both Node versions.
- Ten hostile mutations were rejected across timeout forwarding, `SIGKILL`,
  the upper bound, candidate fallback, the selection assertion, README
  guidance, completed status, plan evidence, and plan registration.
- Exact diff, artifact, credential, conflict-marker, binary, mode, dependency,
  workflow, tracked-metadata, clean-worktree, and whitespace audits passed.
- The optional `agent-browser` pipeline was unavailable on this host; the
  repository-owned real Chrome smoke supplied the applicable interaction,
  responsive geometry, and screenshot validation without reducing coverage.
