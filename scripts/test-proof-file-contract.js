#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  isContainedRegularFile,
  isDirectoryWithoutSymlink,
  isPathContained,
  isValidIsoCalendarDate,
} = require('./proof-file-contract');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'remix-proof-files-'));

try {
  const sourceRoot = path.join(tempRoot, 'poe-source');
  const externalRoot = path.join(tempRoot, 'external');
  fs.mkdirSync(sourceRoot);
  fs.mkdirSync(externalRoot);

  const regularFile = path.join(sourceRoot, 'index.html');
  const dotPrefixedFile = path.join(sourceRoot, '..proof.js');
  const externalFile = path.join(externalRoot, 'outside.js');
  fs.writeFileSync(regularFile, '<!doctype html>\n');
  fs.writeFileSync(dotPrefixedFile, 'inside\n');
  fs.writeFileSync(externalFile, 'outside\n');

  assert.strictEqual(isPathContained(sourceRoot, regularFile), true);
  assert.strictEqual(isPathContained(sourceRoot, dotPrefixedFile), true);
  assert.strictEqual(isPathContained(sourceRoot, externalFile), false);
  assert.strictEqual(isDirectoryWithoutSymlink(sourceRoot), true);
  assert.strictEqual(isContainedRegularFile(sourceRoot, regularFile), true);
  assert.strictEqual(isContainedRegularFile(sourceRoot, dotPrefixedFile), true);
  assert.strictEqual(isContainedRegularFile(sourceRoot, path.join(sourceRoot, 'missing.js')), false);
  assert.strictEqual(isContainedRegularFile(sourceRoot, sourceRoot), false);

  const fileSymlink = path.join(sourceRoot, 'linked.js');
  fs.symlinkSync(externalFile, fileSymlink);
  assert.strictEqual(isContainedRegularFile(sourceRoot, fileSymlink), false);

  const linkedDirectory = path.join(sourceRoot, 'linked-assets');
  fs.symlinkSync(externalRoot, linkedDirectory, 'dir');
  assert.strictEqual(isContainedRegularFile(sourceRoot, path.join(linkedDirectory, 'outside.js')), false);

  const sourceSymlink = path.join(tempRoot, 'linked-source');
  fs.symlinkSync(sourceRoot, sourceSymlink, 'dir');
  assert.strictEqual(isDirectoryWithoutSymlink(sourceSymlink), false);
  assert.strictEqual(isContainedRegularFile(sourceSymlink, path.join(sourceSymlink, 'index.html')), false);

  ['2024-02-29', '2026-05-11', '2000-02-29'].forEach((value) => {
    assert.strictEqual(isValidIsoCalendarDate(value), true, value);
  });
  [null, '', '2026-5-11', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10'].forEach((value) => {
    assert.strictEqual(isValidIsoCalendarDate(value), false, String(value));
  });

  const checkerSource = fs.readFileSync(path.join(__dirname, 'check-proof-source.js'), 'utf8');
  const makefile = fs.readFileSync(path.join(__dirname, '..', 'Makefile'), 'utf8');
  assert.strictEqual((checkerSource.match(/isContainedRegularFile\(/g) || []).length, 9);
  assert.strictEqual((checkerSource.match(/isValidIsoCalendarDate\(/g) || []).length, 1);
  assert.ok(checkerSource.includes('Makefile must preserve authority contract'));
  assert.ok(makefile.includes('override SHELL := /bin/sh'));
  assert.ok(makefile.includes('override NODE := node'));
  assert.ok(makefile.includes('override MAKE := make'));
  assert.ok(makefile.includes('.SECONDEXPANSION:'));
  assert.ok(makefile.includes('$(error MAKEFILE_LIST must not be overridden)'));
  assert.ok(makefile.includes('override ROOT := $(shell sed_path='));
  assert.ok(makefile.includes('export ROOT'));
  assert.ok(makefile.includes('repository Makefile must be loaded alone'));
  assert.ok(makefile.includes('"$$ROOT/scripts/test-makefile-root.sh"'));
  assert.ok(makefile.includes('scripts/test-proof-file-contract.js'));
  assert.ok(makefile.includes('scripts/test-browser-smoke.js'));
  assert.ok(makefile.includes('scripts/smoke-browser.js'));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('proof file contract tests passed');
