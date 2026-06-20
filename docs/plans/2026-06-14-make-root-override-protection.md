# Protect The Derived Make Repository Root

## Status: Completed

## Context

The Makefile resolves script paths from its own location, so normal invocation
already works outside the checkout. A command-line `ROOT` assignment takes
precedence over the file's ordinary assignment, allowing the gate to be
redirected away from the reviewed repository.

## Objectives

- Make the derived absolute repository root authoritative.
- Preserve external-directory invocation and the configurable Node executable.
- Protect override behavior and completed evidence with dependency-free static
  contracts.

## Scope Boundaries

- Do not change proof content, browser behavior, screenshots, Chrome process
  handling, workflows, or dependencies.
- Do not weaken real-browser coverage when Chrome is available.

## Verification

- `make check` from the repository root and an unrelated directory
- an attempted `ROOT=/tmp` command-line override
- Node 20 and Node 24 dependency-free contract checks
- hostile mutations covering override protection, static wiring, completed
  status, and evidence
- exact-base proof, browser, workflow, secret, captured-prompt, and artifact
  scans plus `git diff --check`

## Work Completed

- Marked the Makefile root assignment as override-protected.
- Required the exact declaration in the source and proof-file contract checks.

## Verification Results

- Node 20.19.5 and Node 24.16.0 passed full `make check` runs from both the
  repository root and an unrelated directory with `ROOT=/tmp` supplied on the
  command line.
- Each run passed proof-source and proof-file contracts, browser contract tests,
  both actions, responsive layout checks, and desktop/mobile screenshot pairs.
- Four hostile mutations rejected declaration weakening, checker-wiring removal,
  plan-status drift, and missing `ROOT=/tmp` evidence.
- Exact-base checks preserved proof content, package manifest, browser source,
  screenshots, workflow, and dependencies; no generated artifacts remained.
- `git diff --check` and secret, captured-prompt, dependency, workflow, and
  generated-artifact scans passed.
