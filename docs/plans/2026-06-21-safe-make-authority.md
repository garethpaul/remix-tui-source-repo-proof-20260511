# Safe Make Authority

## Status: Completed

## Problem

The repository root was protected from a direct `ROOT=/tmp` override, but it
was still derived from caller-controlled Makefile state. A command-line
`MAKEFILE_LIST` value redirected quality commands outside the checkout, while
`MAKEFILES` could preload another Makefile before validation. Callers could
also replace the shell and shell flags used by every gate.

## Implementation

- Pin `/bin/sh` and its command flags for all recipes.
- Reject nonempty `MAKEFILES` and any non-file-origin `MAKEFILE_LIST`.
- Resolve one existing checked-in Makefile path to a physical repository root,
  export it to child commands, and fail closed on ambiguous multi-Makefile use.
- Run every public target from the validated root, including nested Make.
- Add `make root-test` to the full verification path.

## Evidence

- 49 executed target, root, shell, and shell-flag authority cases passed.
- Both `MAKEFILE_LIST` override channels were rejected.
- A `MAKEFILES` preload was rejected before any quality command ran.
- Ambiguous multiple-Makefile invocation failed closed.
- A checkout path containing spaces, quotes, brackets, and shell-looking text
  remained data rather than executable syntax.
- `make check` passed with the source, contract, browser, build, and Make
  authority gates enabled.
