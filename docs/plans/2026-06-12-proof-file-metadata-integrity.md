# Proof File Metadata Integrity

## Status: Completed

## Context

The proof checker lexically contains manifest paths under `poe-source`, but its
regular-file checks use `statSync`, which follows symbolic links. A tracked link
inside the source tree could therefore refer outside the proof directory while
still satisfying existence and digest checks. The manifest's `generatedAt`
field also checks only the `YYYY-MM-DD` shape, not whether the date exists.

## Priority

The repository's purpose is to prove an exact self-contained source bundle.
Symlink-following and impossible calendar dates weaken that claim even when all
file names and SHA-256 values appear consistent.

## Requirements

- R1. Manifest and HTML-linked paths must be regular files according to
  `lstat`, never symbolic links or directories.
- R2. Missing or unreadable paths must fail closed without crashing helpers.
- R3. `generatedAt` must be a real UTC calendar date in canonical
  `YYYY-MM-DD` form, including leap-year behavior.
- R4. Dependency-free tests must cover regular, missing, directory, and symlink
  paths plus valid and invalid calendar dates.
- R5. The production checker must use the shared file/date contract.
- R6. `make test`, `make verify`, and `make check` must run the new tests.

## Scope Boundaries

- Do not change the proof source bundle or manifest digests.
- Do not add a package manifest or third-party dependency.
- Do not claim browser rendering coverage from Node VM tests.

## Verification Plan

- `node --check scripts/proof-file-contract.js`
- `node --check scripts/test-proof-file-contract.js`
- `node scripts/test-proof-file-contract.js`
- `node scripts/check-proof-source.js`
- `make test`
- `make check`
- focused hostile metadata and symlink mutations
- `git diff --check`

## Work Completed

- Added a dependency-free proof file contract with lexical and real-path
  containment, non-symlink directory checks, and regular-file `lstat` checks.
- Applied the shared file contract to the manifest, every manifest entry,
  digest validation, HTML-linked assets, stylesheet, and game script.
- Replaced shape-only provenance validation with strict UTC calendar-date
  round-tripping.
- Added dependency-free tests for regular, missing, directory, file-symlink,
  parent-symlink, and source-root-symlink cases plus leap-year/date boundaries.
- Wired the tests into `make test`, `make verify`, and `make check`.
- Updated maintenance, security, roadmap, and change documentation.

## Verification Completed

- Node syntax checks passed for the contract, test, and production checker.
- `node scripts/test-proof-file-contract.js` passed.
- `node scripts/check-proof-source.js`, `make test`, and `make check` passed.
- All 13 focused hostile mutations were rejected from a passing baseline,
  covering symlink-following `stat`, real-path and calendar bypasses,
  over-broad dot-prefix rejection, production and Make wiring, completed plan
  status, direct/parent/source-root symlinks, and impossible or non-canonical
  manifest dates.
- The absolute-path Makefile gate passed when invoked from `/`.
- Full `make check` and syntax validation passed in network-isolated,
  read-only official Node 20.20.2 and Node 24.16.0 Bookworm containers after
  registering the bind-mounted checkout as Git-safe inside each disposable
  container.
- `git diff --check` passed.
