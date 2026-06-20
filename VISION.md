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
- Maintain `make check` for manifest and source proof validation
- Keep proof file digests aligned with checked-in source contents
- Keep browser execution constrained to local scripts and styles
- Keep manifest and HTML asset paths contained within `poe-source`
- Keep proof files regular and non-symlinked under the real source root
- Keep manifest provenance dates valid and canonical
- Keep visible proof status text exposed as a polite live region
- Keep proof status announcements atomic for assistive technology
- Keep proof demo action buttons explicit non-submit controls
- Keep proof demo button keyboard focus visibly styled
- Keep proof demo action buttons wired to visible status updates
- Keep proof demo action buttons associated with the status live region
- Keep proof demo action binding defensive against malformed host documents
- Keep proof demo action status lookup restricted to checked-in own properties
- Keep completed maintenance plans under `docs/plans`
- Keep the dependency-free proof contract running on supported Node.js lines
  in credential-free GitHub Actions validation
- Keep a dependency-free real-browser interaction and screenshot smoke
- Keep desktop/mobile status and action controls visible, non-overlapping, and
  at least 44 pixels tall in the real-browser smoke
- Keep browser launches on isolated Chrome profiles with a bounded 30-second
  timeout, canonical executable provenance, bounded output, and process-group
  cleanup after completed proof artifacts
- Keep the browser server restricted to its exact ephemeral IPv4 loopback Host,
  `GET`, manifest-listed regular files, and deterministic successful requests
- Keep proof and blank screenshot baselines recognizable by their PNG/IHDR
  headers and matched to their declared viewports before comparison
- Keep local secrets and editor metadata out of the checked-in proof artifact
- Avoid adding runtime dependencies without a manifest update

Next priorities:

- Keep manifest metadata aligned with proof source changes
- Document the generator or prompt lineage if this proof is regenerated
- Add browser-level smoke coverage if the demo grows beyond static markup

Contribution rules:

- One PR = one focused source, manifest, proof, or documentation change.
- Keep generated artifacts reproducible.
- Do not mix proof updates with unrelated feature work.
- Preserve file paths expected by the manifest.
- Keep `.github/workflows/check.yml` aligned with the dependency-free source
  proof validator.

## Security And Responsible Use

Canonical security policy and reporting:

- [`SECURITY.md`](SECURITY.md)

Generated source proofs should be inspectable and should not hide external
scripts, telemetry, or privileged browser behavior inside small demo files.

## What We Will Not Merge (For Now)

- Hidden remote scripts
- Unexplained generated rewrites
- Runtime dependencies missing from the manifest
- Claims of broader app behavior than the source implements

This list is a roadmap guardrail, not a permanent rule.
Strong user demand and strong technical rationale can change it.
