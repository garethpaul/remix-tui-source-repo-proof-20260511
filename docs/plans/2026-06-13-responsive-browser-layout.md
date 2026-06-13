# Responsive Browser Layout Contract

## Status: Completed

## Context

The real-browser smoke proves both demo actions execute and captures exact-size
desktop and mobile screenshots. It does not inspect rendered geometry, so a
stylesheet change could push controls outside the viewport, overlap actions,
or shrink the native buttons below the documented 44-pixel target while the
existing interaction and nonblank screenshot checks still pass.

## Priority

The proof is intentionally small and should remain usable at both declared
viewports. Real Chrome geometry provides deterministic evidence for the core
controls without adding a package manager, screenshot fixtures, or a broad
visual-regression framework.

## Objectives

- Record rendered status and button rectangles in the existing browser harness.
- Validate desktop 1280x720 and mobile 390x844 viewport dimensions.
- Require the status and both buttons to stay visible inside each viewport.
- Require both buttons to retain at least 44 pixels of rendered height.
- Reject overlapping action buttons and malformed browser evidence.
- Preserve isolated Chrome profiles and the bounded per-process timeout.

## Work Completed

- Made the isolated smoke iframe fill each declared browser viewport exactly.
- Encoded each declared viewport into the harness URL and sized the iframe
  explicitly before loading the proof, avoiding dependence on headless
  Chrome's outer-window decoration height.
- Rooted the recursive browser target so external-directory `make check`
  executes the same real-Chrome contract.
- Recorded computed status and button geometry after both interactions.
- Added fail-closed viewport, visibility, containment, 44-pixel height,
  overlap, numeric geometry, and opacity validation.
- Ran the interaction harness at both declared viewport sizes while preserving
  exact-size screenshot and blank-page comparisons.
- Added pure helper mutations and static wiring contracts.
- Updated README, vision, and change documentation.

## Verification

- `node scripts/test-browser-smoke.js`
- `CHROME_BIN=google-chrome node scripts/smoke-browser.js`
- `CHROME_BIN=google-chrome make check`
- External-directory `CHROME_BIN=google-chrome make -f <repo>/Makefile check`
- Six correction-focused hostile mutations for missing width/height query
  parameters, bypassed harness wiring, outer-dependent iframe height,
  unrooted recursive Make, and stale plan status were rejected.
- `git diff --check`

The helper suite rejected wrong viewport dimensions, off-screen status,
undersized and overlapping buttons, hidden controls, and malformed geometry.
The real Chrome smoke and full `make check` passed with isolated profiles and
the existing 30-second per-process timeout.

Hosted Chrome 149 initially reported a 1280x577 document viewport for an outer
`--window-size=1280,720`. The explicit iframe viewport correction preserved the
1280x720 and 390x844 layout contracts while allowing the outer screenshot
dimensions to remain separately verified.

## Scope Boundary

This contract checks the proof's core status and action-control geometry in
Chrome. It does not claim pixel-perfect rendering or coverage of other browser
engines.
