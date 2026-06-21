# remix-tui-source-repo-proof-20260511

<!-- README-OVERVIEW-IMAGE -->
![Project overview](docs/readme-overview.svg)

## Overview

`garethpaul/remix-tui-source-repo-proof-20260511` is a static web project. The checked-in files describe a static web project with the structure summarized below.

This README is based on the checked-in source, manifests, scripts, and repository metadata on the `main` branch. The project language mix found during review was: JavaScript (1).

## Repository Contents

- `README.md` - project overview and local usage notes
- `CHANGES.md` - maintenance history for repository checks and source proof updates
- `.github/workflows/check.yml` - hosted dependency-free proof validation
- `.gitignore` - local secret, editor, dependency, and build-output exclusions
- `Makefile` - local verification entry points
- `docs/plans` - completed maintenance plans for the current baseline
- `plans` - historical implementation notes
- `poe-source` - source or example code
- `scripts` - dependency-free proof source validators
- `SECURITY.md` - security reporting and disclosure guidance
- `VISION.md` - project direction and maintenance guardrails

Additional scan context:

- Source directories: poe-source
- Dependency and build manifests: none detected
- Entry points or build surfaces: none detected
- Test-looking files: no obvious test files detected

## Getting Started

### Prerequisites

- Git

### Setup

```bash
git clone https://github.com/garethpaul/remix-tui-source-repo-proof-20260511.git
cd remix-tui-source-repo-proof-20260511
```

The setup commands above are derived from repository files. Legacy mobile, Python, or JavaScript samples may require older SDKs or package versions than a modern workstation uses by default.

## Running or Using the Project

- Open `poe-source/index.html` directly in a browser, or serve it locally with `python3 -m http.server --directory poe-source 8000`.
- The proof manifest identifies `index.html` as the entrypoint and documents the expected `GameLogic.runDemo()` summary: `Repo crystal rally source complete`.
- The proof HTML and manifest declare a self-only Content Security Policy for
  scripts, styles, base URIs, and object content.
- The proof manifest records SHA-256 digests for the HTML, JavaScript, and CSS
  proof files.
- The proof validator keeps manifest entries and HTML asset references inside
  `poe-source`, rejects symlinks and non-regular files, and requires a valid
  calendar date in manifest provenance metadata.
- The proof status message is exposed as a polite live region for assistive
  technology.
- The proof demo buttons update the status live region through the checked-in
  `GameLogic.bindDemoActions(document)` browser binding. The binding ignores
  malformed host documents and button entries.

## Testing and Verification

- Run `make check` before committing proof source changes.
- `make check` delegates to `make verify`, which runs the dependency-free source
  proof checks and proof-file contract tests for manifest metadata, file
  digests, regular non-symlink files, local HTML links, the self-only security
  policy, and the `GameLogic.runDemo()` summary. When Chrome is available it
  also runs a real-browser smoke for both controls, desktop/mobile screenshots,
  and responsive status/button geometry.
- GitHub Actions requires Chrome and runs the same no-install checks plus the
  real-browser smoke on Node.js 20 and 24 using immutable action revisions,
  read-only repository permissions, and checkout credential persistence
  disabled on pushes, pull requests, and manual runs.
- The Make entrypoint derives its repository root from the checked-in Makefile,
  pins `/bin/sh` command semantics, and rejects `MAKEFILES`, `MAKEFILE_LIST`,
  and ambiguous multi-Makefile authority before any quality command runs.
- `make root-test` executes the Make authority regression suite independently.
- Browser processes use isolated Chrome profiles and a bounded 30-second
  timeout while preserving all interaction and screenshot checks. A completed
  DOM dump or screenshot terminates a Chrome process group even when a browser
  build leaves background helpers running. Browser stdout and stderr are each
  bounded to 1 MiB. Explicit
  1280x720 and 390x844 iframe viewports require visible in-viewport controls, 44-pixel
  button heights, and non-overlapping actions. Proof and blank comparison images
  must both have recognized PNG/IHDR headers and exact viewport dimensions
  before their digests are compared.
- A 5-second Chrome discovery timeout uses `SIGKILL` before the 30-second
  execution bound, so a configured or shadowed browser cannot stall candidate
  fallback. Discovery examines at most five unique candidates and resolves the
  selected browser to a canonical absolute executable regular file before use.
- The browser server owns an ephemeral IPv4 loopback port, accepts only the
  exact `127.0.0.1:<port>` Host header and `GET`, and serves only manifest-listed
  regular source files up to 1 MiB. Browser request evidence must include the
  expected HTML, CSS, JavaScript, harness, and blank baseline without unexpected
  paths or failed responses.
- Screenshot artifacts must be regular non-symlink files between 64 bytes and
  16 MiB with nonzero PNG/IHDR dimensions matching the requested viewport.
- Hosted jobs print the runner-provided Chrome version. The GitHub runner image
  browser is observed but not hermetically pinned; action revisions are pinned
  by commit and the browser behavior is revalidated on every run.
- The local path checks reject manifest entries or HTML asset references that
  try to escape `poe-source`.
- The HTML checks also require the visible status message to keep `role="status"`
  with `aria-live="polite"` and `aria-atomic="true"`, and require proof demo
  action buttons to declare `type="button"`.
- The CSS checks require demo buttons to keep an explicit visible
  `button:focus-visible` outline.
- The JavaScript checks require demo action buttons to expose deterministic
  status text, update the live region when clicked, and ignore malformed
  binding inputs. Unknown action names, including inherited object property
  names, must use the documented proof summary fallback.
- The HTML checks require demo action buttons to declare that they control the
  status live region.
- The source proof validator also requires completed canonical plans under `docs/plans`.

When the required SDK or runtime is unavailable, use static checks and source review first, then verify on a machine that has the matching platform toolchain.

## Configuration and Secrets

- No required secret or credential file was identified in the repository scan. If you add integrations later, keep secrets out of git.
- The source proof rejects tracked `.env` files and common editor metadata;
  keep local configuration outside version control.

## Security and Privacy Notes

- Review changes touching file, media, JSON, XML, CSV, OCR, or data parsing; examples from the scan include poe-source/PACKAGE_MANIFEST.json.

## Maintenance Notes

- See `SECURITY.md` for vulnerability reporting and safe research guidance.
- See `VISION.md` for project direction and contribution guardrails.
- See `docs/plans/2026-06-08-remix-tui-source-proof-baseline.md` for the
  canonical static proof validation baseline.
- See `docs/plans/2026-06-08-proof-file-digests.md` for the proof digest
  validation baseline.
- See `docs/plans/2026-06-09-proof-path-containment.md` for the source-root
  path containment guard.
- See `docs/plans/2026-06-09-proof-status-live-region.md` for the proof status
  live-region guard.
- See `docs/plans/2026-06-09-proof-status-atomic.md` for the proof status
  atomic live-region guard.
- See `docs/plans/2026-06-09-proof-button-type-guard.md` for the proof demo
  button type guard.
- See `docs/plans/2026-06-09-proof-button-focus-visible.md` for the proof demo
  keyboard focus guard.
- See `docs/plans/2026-06-09-proof-demo-button-status.md` for the proof demo
  button status guard.
- See `docs/plans/2026-06-09-proof-button-status-controls.md` for the proof
  demo button `aria-controls` guard.
- See `docs/plans/2026-06-10-ci-baseline.md` for the GitHub Actions baseline.
- See `docs/plans/2026-06-10-hosted-proof-validation.md` for the hosted
  validation baseline.
- See `docs/plans/2026-06-10-proof-demo-binding-guard.md` for malformed demo
  document binding guards.
- See `docs/plans/2026-06-10-proof-action-own-property.md` for the demo action
  own-property lookup guard.
- See `docs/plans/2026-06-12-proof-file-metadata-integrity.md` for regular-file,
  real-path containment, and calendar-date validation.
- See `docs/plans/2026-06-12-real-browser-proof-smoke.md` for Chrome interaction
  and desktop/mobile screenshot validation.
- See `docs/plans/2026-06-13-responsive-browser-layout.md` for rendered
  desktop/mobile status and action-control geometry validation.

## Contributing

Keep changes small and tied to the project that is already present in this repository. For code changes, document the toolchain used, avoid committing generated dependency directories or local configuration, and update this README when setup or verification steps change.
