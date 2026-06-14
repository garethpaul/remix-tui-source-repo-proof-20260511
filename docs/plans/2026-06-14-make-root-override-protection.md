# Protect The Derived Make Repository Root

## Status: Planned

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

## Work Planned

- Mark the Makefile root assignment as override-protected.
- Require the exact declaration in the source and proof-file contract checks.
