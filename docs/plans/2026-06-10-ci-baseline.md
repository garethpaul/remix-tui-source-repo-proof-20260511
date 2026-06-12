# Remix TUI Source Proof CI Baseline

## Status: Completed

## Context

`remix-tui-source-repo-proof-20260511` has a dependency-free Node source proof
baseline behind `make check`. The repository needs that baseline to run in
GitHub Actions so manifest, digest, CSP, path containment, and demo smoke
contracts are checked before review.

## Objectives

- Run the existing `make check` wrapper in GitHub Actions.
- Keep the hosted job dependency-free beyond a pinned Node runtime.
- Make the workflow presence part of the source proof baseline contract.

## Work Completed

- Added `.github/workflows/check.yml` to run `make check` on pushes, pull
  requests, and manual dispatches.
- Set up Node 20 for the dependency-free proof validator.
- Extended `scripts/check-proof-source.js` to require the CI workflow and this
  completed plan.
- Updated README, VISION, SECURITY, and CHANGES with the CI baseline.

## Verification

- `make check`
- `node scripts/check-proof-source.js`
- `git diff --check`

## Follow-Up Candidates

- Add browser smoke coverage if the proof source grows beyond static markup and
  the current Node smoke harness.
