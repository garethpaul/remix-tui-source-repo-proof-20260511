override SHELL := /bin/sh
override .SHELLFLAGS := -c
ifneq ($(strip $(MAKEFILES)),)
$(error MAKEFILES must be empty; repository verification requires this Makefile to be loaded alone)
endif
override MAKEFILES :=
ifneq ($(origin MAKEFILE_LIST),file)
$(error MAKEFILE_LIST must not be overridden)
endif
override ROOT := $(shell path='$(subst ','"'"',$(MAKEFILE_LIST))'; path=$$(printf '%s' "$$path" | /usr/bin/sed 's/^ //'); [ -f "$$path" ] || exit 1; directory=$$(/usr/bin/dirname -- "$$path"); CDPATH= cd -- "$$directory" && /bin/pwd -P)
export ROOT
ifeq ($(strip $(ROOT)),)
$(error repository Makefile path could not be resolved)
endif

NODE ?= node

.PHONY: browser build check lint root-test test verify

lint:
	cd "$$ROOT" && $(NODE) scripts/check-proof-source.js

browser:
	@cd "$$ROOT" && if command -v "$${CHROME_BIN:-google-chrome}" >/dev/null 2>&1; then \
		$(NODE) scripts/smoke-browser.js; \
	else \
		echo "Chrome unavailable; real-browser smoke not run"; \
	fi

test: lint
	cd "$$ROOT" && $(NODE) scripts/test-proof-file-contract.js
	cd "$$ROOT" && $(NODE) scripts/test-browser-smoke.js
	$(MAKE) --no-print-directory -f "$$ROOT/Makefile" browser

build:
	@cd "$$ROOT" && echo "static source proof; no build step required"

root-test:
	cd "$$ROOT" && scripts/test-makefile-root.sh

verify: lint test build root-test

check: verify
