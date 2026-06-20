# Browser Source Proof Deep Review Implementation Plan

## Status: Completed

## Review Evidence

- Root cause: commit `785d3e8` introduced the real-browser server, discovery,
  and child-process wait. The implementation trusted unresolved executable
  names, served any lexically contained readable path, accumulated unbounded
  output, and required Chrome to exit after producing proof artifacts. Commit
  `1e9150d` added screenshot comparison without byte or output-file type bounds;
  commit `cf550b9` bounded each probe but carried unresolved executable
  provenance forward. Confidence: clear from bounded `git log -S` history.
- Local Node `v25.8.1` syntax checks, proof checker, file contracts, browser
  contracts, `git diff --check`, root `make check`, and `/` caller-independent
  `make check ROOT=/tmp` passed.
- Google Chrome `149.0.7827.116` passed desktop and mobile real-browser proof
  interaction, exact request auditing, nonblank screenshots, and process-group
  completion cleanup. The in-app browser independently clicked both actions,
  reported no warning/error console logs, and measured the 390x844 layout with
  both controls at 44 pixels tall and inside the viewport.
- Ten hostile mutations were rejected: candidate count, canonical executable
  return, Host enforcement, GET enforcement, screenshot byte maximum,
  completion cleanup, unexpected requests, resource mapping, process-group
  cleanup policy, and artifact symlink rejection.
- Redacted Gitleaks and current-tree/full-history credential scans found zero
  findings. GitHub CodeQL, secret-scanning, and Dependabot open-alert counts
  were zero. The repository contains no dependency manifest to audit.
- `actions/checkout@v6.0.3` and `actions/setup-node@v6.4.0` commit pins were
  verified against their official Git tags. Hosted Chrome remains runner-owned
  and observed in logs rather than hermetically version-pinned.

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Consolidate PRs #1-#6 while hardening the dependency-free browser/source-proof boundary against unsafe browser discovery, local-server path confusion, unbounded artifacts, hidden browser failures, and incomplete cleanup.

**Architecture:** Keep the existing dependency-free Node harness and linear PR stack. Strengthen small ownership-boundary helpers in `scripts/smoke-browser.js`, exercise them through direct contract tests in `scripts/test-browser-smoke.js`, and make `scripts/check-proof-source.js` enforce the reviewed workflow and harness contract. Preserve the static proof, exact manifest mapping, read-only CI permissions, and caller-independent Make root.

**Tech Stack:** Node.js 20/24 built-ins, GNU/BSD Make, headless Chrome, GitHub Actions.

---

### Task 1: Prove browser executable provenance

**Files:**
- Modify: `scripts/test-browser-smoke.js`
- Modify: `scripts/smoke-browser.js`

**Step 1: Write failing tests**

Add contract cases that require Chrome discovery to deduplicate a bounded candidate list, resolve PATH candidates to canonical absolute regular executable files, reject unsafe relative `CHROME_BIN` paths, and return the probed executable path rather than an unresolved command name.

**Step 2: Run tests to verify failure**

Run: `node scripts/test-browser-smoke.js`

Expected: FAIL because `findChrome` currently probes unresolved names without provenance checks or candidate bounding.

**Step 3: Implement minimal discovery helpers**

Add explicit candidate normalization, PATH resolution, executable metadata validation, canonicalization, and a fixed maximum probe count while retaining the five-second per-probe timeout and deterministic fallback order.

**Step 4: Run tests to verify pass**

Run: `node scripts/test-browser-smoke.js`

Expected: PASS.

### Task 2: Prove localhost server ownership and source mapping

**Files:**
- Modify: `scripts/test-browser-smoke.js`
- Modify: `scripts/smoke-browser.js`
- Reuse: `scripts/proof-file-contract.js`

**Step 1: Write failing tests**

Add tests that reject non-loopback Host headers, non-GET requests, traversal/encoded separators, symlinked files, non-regular files, files outside the manifest allowlist, and oversized source responses. Assert that ephemeral listener metadata is exactly IPv4 loopback with a nonzero owned port.

**Step 2: Run tests to verify failure**

Run: `node scripts/test-browser-smoke.js`

Expected: FAIL because the server currently follows readable paths and does not enforce request method, host ownership, manifest mapping, or byte limits.

**Step 3: Implement minimal server contract**

Build the allowlist from the checked manifest, validate the listener address, enforce loopback Host and GET-only requests, and serve only bounded contained regular files through no-follow checks.

**Step 4: Run tests to verify pass**

Run: `node scripts/test-browser-smoke.js`

Expected: PASS.

### Task 3: Prove browser process and artifact bounds

**Files:**
- Modify: `scripts/test-browser-smoke.js`
- Modify: `scripts/smoke-browser.js`

**Step 1: Write failing tests**

Add cases for bounded stdout/stderr capture, timeout cleanup, spawn errors, exactly-once settlement, screenshot minimum/maximum byte limits, output symlink/type rejection, and malformed or implausible PNG dimensions.

**Step 2: Run tests to verify failure**

Run: `node scripts/test-browser-smoke.js`

Expected: FAIL because output collection and screenshot reads are currently unbounded and process cleanup only targets the immediate Chrome process.

**Step 3: Implement minimal process/artifact helpers**

Use bounded output collectors, deterministic termination with process-group cleanup where supported, guarded output reads, and screenshot byte/dimension validation before hashing.

**Step 4: Run tests to verify pass**

Run: `node scripts/test-browser-smoke.js`

Expected: PASS.

### Task 4: Surface browser navigation and runtime failures

**Files:**
- Modify: `scripts/test-browser-smoke.js`
- Modify: `scripts/smoke-browser.js`

**Step 1: Write failing tests**

Add cases requiring the harness result to fail closed on iframe navigation failure, page errors, unhandled rejections, unexpected external resource origins, non-200 source responses, or missing deterministic source requests.

**Step 2: Run tests to verify failure**

Run: `node scripts/test-browser-smoke.js`

Expected: FAIL because the current result includes only interaction and geometry state.

**Step 3: Implement minimal runtime evidence**

Record harness runtime errors and requested source paths, require the expected source-to-proof request set, and reject unexpected network destinations without adding a browser automation dependency.

**Step 4: Run tests to verify pass**

Run: `node scripts/test-browser-smoke.js`

Expected: PASS.

### Task 5: Align policy, documentation, and CI

**Files:**
- Modify: `scripts/check-proof-source.js`
- Modify: `README.md`
- Modify: `CHANGES.md`
- Modify: `.github/workflows/check.yml` only if the reviewed action/browser contract requires it

**Step 1: Write failing policy assertions**

Extend the source checker to require the new ownership, provenance, output-bound, and failure-reporting contract.

**Step 2: Run policy check to verify failure**

Run: `node scripts/check-proof-source.js`

Expected: FAIL until the checker and documentation describe the strengthened behavior.

**Step 3: Update policy and documentation**

Record exact Chrome version output in hosted logs, preserve commit-pinned official actions and `contents: read`, document that runner Chrome is observed rather than hermetically pinned, and describe the local `CHROME_BIN` browser gate.

**Step 4: Run focused and full checks**

Run: `node scripts/check-proof-source.js && node scripts/test-proof-file-contract.js && node scripts/test-browser-smoke.js`

Run: `CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" make check`

Run: `cd / && CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" make -f "$PWD/Users/gpj/Documents/Codex/2026-06-18/goal-go-through-and-maintain-my-2/work/agent-remix-tui-proof-stack/repo/Makefile" check ROOT=/tmp`

Expected: all checks pass and real Chrome verifies desktop/mobile interaction and screenshots.

### Task 6: Security, mutation, and hosted evidence

**Files:**
- Modify: `scripts/test-browser-smoke.js`
- Modify: `docs/plans/2026-06-19-browser-source-proof-deep-review.md`

**Step 1: Run hostile mutations**

Mutate each new invariant independently and confirm the focused contract or source checker fails for the intended reason.

**Step 2: Audit repository state**

Run syntax checks, `git diff --check`, current-tree and full-history credential scans without printing values, dependency/manifest checks, action pin verification, and GitHub security-alert queries.

**Step 3: Push consolidation and verify hosted gates**

Push the reviewed branch, open a consolidation PR based on the top stack head, require exact-head Node 20/24 and CodeQL results where configured, then merge without bypassing protection.

**Step 4: Close superseded PRs**

Close only PRs whose complete changes are present in the merged consolidation and report the final protected-branch SHA.
