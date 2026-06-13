# Screenshot Baseline Integrity

## Status: Pending

## Context

The Chrome smoke validates each proof screenshot as an exact-size PNG, then
compares its digest with a blank-page screenshot. The blank comparison file is
read and hashed without validating its PNG structure or dimensions, so an
invalid or mismatched baseline could make the nonblank assertion pass without
a valid like-for-like reference.

## Requirements

- **R1:** Reject malformed proof and blank screenshot PNG data.
- **R2:** Require both screenshots to match the declared viewport dimensions.
- **R3:** Preserve the exact digest inequality check after both inputs pass
  structural validation.
- **R4:** Keep the browser smoke dependency-free and preserve isolated Chrome
  profiles, responsive geometry checks, interactions, and bounded timeouts.
- **R5:** Add mutation-sensitive helper and production-wiring coverage, then
  record completed local and hosted verification truthfully.

## Implementation Units

### U1. Screenshot Pair Contract

Extract the screenshot-pair validation in `scripts/smoke-browser.js` so both
proof and blank images pass the existing PNG-header and exact-dimension checks
before their digests are compared.

### U2. Contract Tests

Extend `scripts/test-browser-smoke.js` with valid pairs and malformed,
wrong-size, identical-image, and production-wiring mutations.

### U3. Documentation And Evidence

Synchronize `README.md`, `SECURITY.md`, `VISION.md`, and `CHANGES.md`; run the
focused Node checks, real Chrome smoke, full `make check`, hostile mutations,
and repository integrity scans before marking this plan completed.

## Scope Boundaries

- Do not introduce image-decoding packages or screenshot fixtures.
- Do not change proof UI behavior, CSS, viewport declarations, or Chrome
  process isolation.
- Do not claim pixel-perfect visual regression or non-Chrome browser coverage.

## Verification

- `node scripts/test-browser-smoke.js`
- `CHROME_BIN=google-chrome node scripts/smoke-browser.js`
- `CHROME_BIN=google-chrome make check`
- malformed, wrong-size, identical, bypassed-wiring, documentation, status,
  and evidence mutations
- Node syntax, workflow YAML, protected-file, secret, artifact, and
  `git diff --check` gates

## Work Completed

Pending implementation.

## Verification Results

Pending implementation and validation; `make check` evidence will be recorded
before completion.
