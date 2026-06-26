# Proof Hard-Link Integrity

## Status: Completed

## Goal

Require each proof source and browser artifact path to own a single inode link,
preventing an external path from mutating validated bytes through a hard link.

## Root cause

The proof file contract rejected symlinks and required lexical plus real-path
containment, but a regular file with `nlink > 1` still passed. An external hard
link could therefore share the inode behind a path inside `poe-source`. The
bounded browser reader had the same gap for source and screenshot files.

## Implementation

- Reject proof files whose `lstat` link count is not exactly one.
- Recheck the opened descriptor link count before allocating or reading bytes.
- Add behavioral regressions for an external hard link in the shared proof
  contract and a hard-linked browser artifact.
- Require the production guards and tests from the source policy checker.

## Verification Completed

- RED: the shared proof contract accepted an external hard link before the fix.
- `node scripts/test-proof-file-contract.js` passed.
- `node scripts/test-browser-smoke.js` passed.
- `node scripts/check-proof-source.js` passed.
- `make check` passed the dependency-free source, browser, and Make authority
  graph.
- Eight hostile mutations covering removal of link-count guards, behavioral
  tests, policy registration, documentation, and completed-plan evidence were
  rejected.

## Remaining scope

- Single-link ownership prevents alternate hard-link paths; it does not stop a
  privileged process from modifying the checked path itself during execution.
