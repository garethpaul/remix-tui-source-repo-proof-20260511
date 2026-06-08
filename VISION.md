## Remix TUI Source Repo Proof Vision

Remix TUI Source Repo Proof is a minimal source bundle for a small browser demo
called Repo Crystal Rally.

The repository is useful as a proof artifact: it contains the generated HTML,
game script, and package manifest that show what source files were produced for
the demo.

The goal is to preserve the proof source in a form that is easy to inspect,
rerun, and compare against future generated output.

The current focus is:

Priority:

- Preserve the `poe-source` artifact structure
- Keep the demo script and HTML minimal and readable
- Make generated-source provenance clear
- Avoid adding runtime dependencies without a manifest update

Next priorities:

- Add a README that explains how the proof artifact was generated
- Include a local run command for opening or serving the demo
- Document expected output from `GameLogic.runDemo()`
- Add a simple smoke check for the HTML and script link

Contribution rules:

- One PR = one focused source, manifest, proof, or documentation change.
- Keep generated artifacts reproducible.
- Do not mix proof updates with unrelated feature work.
- Preserve file paths expected by the manifest.

## Security And Responsible Use

Generated source proofs should be inspectable and should not hide external
scripts, telemetry, or privileged browser behavior inside small demo files.

## What We Will Not Merge (For Now)

- Hidden remote scripts
- Unexplained generated rewrites
- Runtime dependencies missing from the manifest
- Claims of broader app behavior than the source implements
