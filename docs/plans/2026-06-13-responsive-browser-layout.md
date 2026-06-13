# Responsive Browser Layout Contract

## Status: In Progress

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

## Planned Verification

- `node scripts/test-browser-smoke.js`
- `CHROME_BIN=google-chrome node scripts/smoke-browser.js`
- `CHROME_BIN=google-chrome make check`
- Focused hostile mutations for viewport, visibility, size, overlap, and wiring
- `git diff --check`

## Scope Boundary

This contract checks the proof's core status and action-control geometry in
Chrome. It does not claim pixel-perfect rendering or coverage of other browser
engines.
