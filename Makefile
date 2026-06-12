ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
NODE ?= node

.PHONY: build check lint test verify

lint:
	$(NODE) "$(ROOT)/scripts/check-proof-source.js"

test: lint
	$(NODE) "$(ROOT)/scripts/test-proof-file-contract.js"

build:
	@echo "static source proof; no build step required"

verify: lint test build

check: verify
