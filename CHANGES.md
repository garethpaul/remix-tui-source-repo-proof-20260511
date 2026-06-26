# Changes

## 2026-06-26 14:44 PDT - P1 - Reject hard-linked proof files

### Summary

Closed an inode-ownership gap where a proof asset or browser artifact could be
a regular hard link to an externally mutable path while still passing symlink
and real-path containment checks.

### Work completed

- Required a link count of one in the shared proof-file contract.
- Rechecked link ownership on opened browser source and screenshot descriptors.
- Added behavioral hard-link regressions and static policy registration.

### Threads

- None; the focused contract, browser reader, tests, and documentation work was
  completed directly.

### Files changed

- `scripts/proof-file-contract.js` — reject multiply linked proof files.
- `scripts/smoke-browser.js` — reject and revalidate hard-linked artifacts.
- `scripts/test-proof-file-contract.js`, `scripts/test-browser-smoke.js` — causal
  external hard-link regressions.
- `scripts/check-proof-source.js` — enforce guards, tests, and completed plan.
- `README.md`, `SECURITY.md`, `VISION.md`, `AGENTS.md`,
  `docs/plans/2026-06-26-proof-hard-link-integrity.md` — document the boundary.

### Validation

- Focused file and browser contract tests — passed.
- Eight hostile hard-link mutations — rejected.
- Node 20.20.2 and 24.17.0 `make check` — passed with 77 Make authority
  cases, source validation, contract tests, eight mutations, and real Chrome
  desktop/mobile interaction and screenshot checks.
- Absolute external-directory Make verification with `ROOT=/tmp` — passed.
- Hosted validation — pending.

### Bugs / findings

- P1 fixed: `isContainedRegularFile` accepted a proof path sharing its inode
  with an external file, and the bounded browser reader accepted the same state.

### Blockers

- None locally; hosted Node, Chrome, and CodeQL checks remain pending.

### Next action

- Open the PR and require exact-head hosted Node, Chrome, and CodeQL checks.

## 2026-06-21

- Made every Make quality gate safe for spaced and shell-sensitive checkout
  paths and rejected caller-controlled root, runtime, recursive-Make, shell,
  preload, and Makefile-list authority without changing proof content.
- Added a deferred final-file-set guard so a later `-f` Makefile cannot replace
  a public verification target after the repository Makefile is parsed.

## 2026-06-19

- Resolved Chrome candidates to canonical executable files, deduplicated and
  bounded discovery, and rejected unsafe relative browser paths.
- Made valid DOM and screenshot completion terminate lingering Chrome process
  groups while bounding browser output and preserving the 30-second timeout.
- Restricted the ephemeral proof server to its exact IPv4 loopback Host,
  `GET`, manifest-listed regular files, and bounded source responses.
- Added deterministic request auditing, optional empty favicon handling,
  bounded non-symlink screenshot reads, and exact source-resource mapping.

## 2026-06-17

- Added a 5-second Chrome discovery timeout with `SIGKILL` and deterministic
  fallback coverage so a stuck candidate cannot block the real-browser gate.

## 2026-06-13

- Required both proof and blank comparison screenshots to have recognized
  PNG/IHDR headers and exact viewport dimensions before digest comparison.
- Made responsive browser geometry independent of headless Chrome outer-window
  decoration by applying each declared viewport directly to the smoke iframe.
- Made recursive browser verification independent of the caller's working
  directory.
- Added real-Chrome desktop/mobile geometry checks for visible status and
  action controls, 44-pixel button heights, and non-overlapping buttons.
- Isolated every Chrome launch in its own profile and raised the bounded
  per-process timeout to 30 seconds without reducing interaction or screenshot
  coverage.
- Preserved isolated Chrome profiles and the 30-second bound in static and
  helper contracts.

## 2026-06-12

- Added a dependency-free real-browser Chrome smoke for both proof actions and
  nonblank desktop/mobile screenshots.
- Added dependency-free real-path and regular-file validation for proof
  manifest entries and HTML-linked assets.
- Rejected file and parent-directory symlinks and required `generatedAt` to be
  a real canonical calendar date.

## 2026-06-10

- Restricted demo action status lookups to checked-in own properties and added
  adversarial coverage for inherited object property names.
- Guarded demo action binding against malformed document and button objects.
- Added pinned, credential-free, least-privilege GitHub Actions validation on
  Node.js 20 and 24 for pushes, pull requests, and manual dispatches.
- Made the Makefile validation entrypoint independent of the caller's current
  directory.
- Added fail-closed exact checks for the hosted workflow and both completed CI
  plans.
- Added local secret/editor exclusions and fail-closed tracked-metadata checks.

## 2026-06-09

- Associated proof demo buttons with the status live region and added
  validator coverage for `aria-controls`.
- Wired proof demo buttons to update the status live region and added validator
  coverage for action status text and click-handler behavior.
- Added an explicit visible `button:focus-visible` style and validator guard
  for proof demo keyboard focus.
- Required the proof status live region to be atomic and refreshed the
  validator coverage plus manifest digest.
- Added explicit non-submit types to proof demo action buttons and validator
  coverage for that markup contract.
- Marked the proof page status message as a polite live region and added
  validator coverage for that accessibility contract.
- Added source-root containment checks so proof manifest entries and HTML asset
  references cannot escape `poe-source`.

## 2026-06-08

- Added manifest SHA-256 digest validation for the proof HTML, JavaScript, and
  CSS files.
- Added a self-only Content Security Policy to the proof source and manifest.
- Added a dependency-free source proof smoke check for the package manifest,
  local HTML asset links, document metadata, and `GameLogic.runDemo()`.
- Added missing `lang`, `charset`, and viewport metadata to the proof HTML.
- Documented `make verify` and `make check` as repository verification commands.
- Added proof manifest metadata for demo name, source root, entrypoint,
  generated date, and expected `GameLogic.runDemo()` output.
- Added canonical `docs/plans` coverage and made the proof source validator
  require completed plans.
