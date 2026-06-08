.PHONY: build check lint test verify

lint:
	node scripts/check-proof-source.js

test: lint

build:
	@echo "static source proof; no build step required"

verify: lint test build

check: verify
