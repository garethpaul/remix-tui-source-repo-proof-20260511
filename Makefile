.DEFAULT_GOAL := check

.PHONY: browser build check lint root-test test verify
.SECONDEXPANSION:

override SHELL := /bin/sh
override .SHELLFLAGS := -c
override NODE := node
override MAKE := make
ifneq ($(strip $(MAKEFILES)),)
$(error MAKEFILES must be empty; repository verification requires this Makefile to be loaded alone)
endif
override MAKEFILES :=
ifneq ($(origin MAKEFILE_LIST),file)
$(error MAKEFILE_LIST must not be overridden)
endif
override ROOT := $(shell sed_path=/usr/bin/sed; [ -x "$$sed_path" ] || sed_path=/bin/sed; [ -x "$$sed_path" ] || exit 1; path=$$(printf '%s' '$(subst ','"'"',$(MAKEFILE_LIST))' | "$$sed_path" 's/^ //'); [ -f "$$path" ] || exit 1; directory=$${path%/*}; [ "$$directory" != "$$path" ] || directory=.; CDPATH= cd "$$directory" && pwd -P)
export ROOT
ifeq ($(strip $(ROOT)),)
$(error repository Makefile path could not be resolved)
endif

browser build check lint root-test test verify: $$(if $$(filter file,$$(origin MAKEFILE_LIST)),,$$(error MAKEFILE_LIST must not be overridden))
browser build check lint root-test test verify: $$(if $$(shell sed_path=/usr/bin/sed && [ -x "$$$$sed_path" ] || sed_path=/bin/sed && [ -x "$$$$sed_path" ] && path=$$$$(printf '%s' '$$(subst ','"'"',$$(MAKEFILE_LIST))' | "$$$$sed_path" 's/^ //') && [ -f "$$$$path" ] && printf '%s' ok),,$$(error repository Makefile must be loaded alone))

lint:
	$(NODE) "$$ROOT/scripts/check-proof-source.js"

browser:
	@if command -v "$${CHROME_BIN:-google-chrome}" >/dev/null 2>&1; then \
		$(NODE) "$$ROOT/scripts/smoke-browser.js"; \
	else \
		echo "Chrome unavailable; real-browser smoke not run"; \
	fi

test: lint
	$(NODE) "$$ROOT/scripts/test-proof-file-contract.js"
	$(NODE) "$$ROOT/scripts/test-browser-smoke.js"
	$(MAKE) --no-print-directory --file "$$ROOT/Makefile" browser

build:
	@echo "static source proof; no build step required"

root-test:
	"$$ROOT/scripts/test-makefile-root.sh"

verify: root-test lint test build

check: verify
