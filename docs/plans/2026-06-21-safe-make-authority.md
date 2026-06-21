# Safe Make Authority

## Status: Completed

## Context

The derived Make root used `lastword`, so checkout paths containing spaces were
split and redirected the browser gate. Caller-controlled `MAKEFILE_LIST`,
`MAKEFILES`, `ROOT`, `NODE`, `MAKE`, `SHELL`, and `.SHELLFLAGS` could also
redirect or influence repository verification.

## Scope Boundaries

- Do not change proof HTML, CSS, JavaScript, manifest metadata, screenshots, or
  browser ownership semantics.
- Preserve dependency-free Node 20/24 verification and the optional local
  Chrome fallback message.
- Do not add package dependencies or generated artifacts.

## Work Completed

- Canonicalize the checked-in Makefile through quoted POSIX shell operations without
  splitting spaces or interpreting shell-sensitive checkout names.
- Freeze runtime, recursive-Make, and shell authority and export the canonical
  root as data instead of interpolating it into recipe source.
- Reject both `MAKEFILE_LIST` replacement channels, `MAKEFILES` preloads, and
  ambiguous multiple-`-f` invocations before or after the repository Makefile
  before a quality command or replacement recipe runs.
- Add an executable dependency-free root suite to `make verify` and `make check`.

## Verification Completed

- Node 20.19.5 and Node 24.16.0 passed `make check` with real Chrome from the
  repository root and an unrelated directory.
- All 77 executed target, root, shell, runtime, and recursive-Make authority cases
  passed from a path containing spaces, quotes, brackets, an apostrophe, and backticks.
- Both `MAKEFILE_LIST` override channels and a `MAKEFILES` preload failed closed;
  the ambiguous multiple-Makefile invocation failed closed with extra `-f`
  inputs both before and after the repository Makefile.
- Proof source, manifest, browser contracts, both actions, responsive desktop
  and mobile screenshots, `git diff --check`, and strict Git object validation passed.
