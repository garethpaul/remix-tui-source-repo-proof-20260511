ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
NODE ?= node

.PHONY: browser build check lint test verify

lint:
	$(NODE) "$(ROOT)/scripts/check-proof-source.js"

browser:
	@if command -v "$${CHROME_BIN:-google-chrome}" >/dev/null 2>&1; then \
		$(NODE) "$(ROOT)/scripts/smoke-browser.js"; \
	else \
		echo "Chrome unavailable; real-browser smoke not run"; \
	fi

test: lint
	$(NODE) "$(ROOT)/scripts/test-proof-file-contract.js"
	$(NODE) "$(ROOT)/scripts/test-browser-smoke.js"
	$(MAKE) -f "$(ROOT)/Makefile" browser

build:
	@echo "static source proof; no build step required"

verify: lint test build

check: verify
