# Real-Browser Proof Smoke

## Status: Completed

## Context

The proof checker evaluates `game.js` in a Node VM with mocked document and
button objects. That validates defensive bindings and status strings, but it
does not prove that the shipped HTML, CSP, stylesheet, and script execute
together in a browser engine.

## Priority

The repository is itself a source-proof artifact. A same-origin browser smoke
should verify that both rendered controls bind successfully and update the
accessible live region without adding a package manager or browser library.

## Objectives

- Serve the proof and a same-origin test harness from a loopback-only HTTP
  server.
- Launch an installed Chrome/Chromium binary with a bounded timeout.
- Click both proof buttons and verify the exact live-region transitions.
- Capture deterministic desktop and mobile screenshots and reject blank or
  missing output.
- Keep the existing dependency-free VM, file-integrity, and workflow contracts.
- Integrate browser smoke into the repository gate only when Chrome is
  available, while requiring hosted validation to install and execute it.

## Work Completed

- Added a loopback-only proof server and same-origin browser harness.
- Clicked both proof actions in Chrome and asserted the exact accessible status
  transitions.
- Captured desktop and mobile proof screenshots, validated PNG dimensions, and
  rejected screenshots matching same-viewport blank pages.
- Added dependency-free helper contracts and Make gate integration.
- Made hosted Node 20/24 validation require Chrome and run the browser gate.
- Extended exact workflow, file, Make, plan, and documentation contracts.

## Verification

- `node scripts/test-browser-smoke.js`
- `CHROME_BIN=google-chrome node scripts/smoke-browser.js`
- `make check`
- Chrome 80 completed both actions and desktop/mobile screenshot checks on the
  local host, including three consecutive runs after fixing an initial iframe
  readiness race.
- Two focused hostile mutations removed the hosted Chrome requirement and
  broke the release-button interaction; the exact workflow checker and actual
  browser smoke rejected them.
- Screenshot dimension/nonblank checks, workflow YAML parse, and
  `git diff --check`.
