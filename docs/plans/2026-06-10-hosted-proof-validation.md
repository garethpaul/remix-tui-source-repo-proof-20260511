# Hosted Proof Validation

Status: Completed

## Context

The repository is a dependency-free static source proof whose payload is locked
by the SHA-256 digests in `poe-source/PACKAGE_MANIFEST.json`. Its local
`make check` contract validated the proof, but the default branch did not run
that contract in hosted CI and the Makefile assumed the caller's current
directory was the repository root.

## Objectives

- Run the existing proof contract on pushes, pull requests, and manual runs.
- Cover the active Node.js 20 and 24 release lines without installing packages.
- Pin third-party actions to immutable commits with least-privilege permissions.
- Keep validation usable when the Makefile is invoked from outside the checkout.

## Work Completed

- Added `.github/workflows/check.yml` with a fixed Ubuntu 24.04 runner and a
  Node.js 20/24 matrix.
- Pinned checkout and Node setup actions to reviewed immutable commits and
  disabled persisted checkout credentials.
- Made Makefile script paths resolve relative to the Makefile itself.
- Extended the source proof checker to fail closed when the hosted validation
  plan or required workflow controls are removed.

## Verification

- `make check`
- `make -f /path/to/repository/Makefile check` from outside the repository
- `git diff --check`
