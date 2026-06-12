#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { assertInteractionDom, parsePngDimensions } = require('./smoke-browser');

const png = Buffer.alloc(24);
Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png, 0);
png.write('IHDR', 12, 'ascii');
png.writeUInt32BE(1280, 16);
png.writeUInt32BE(720, 20);
assert.deepStrictEqual(parsePngDimensions(png), { width: 1280, height: 720 });
assert.throws(() => parsePngDimensions(Buffer.alloc(24)), /valid PNG/u);

const result = {
  buttonCount: 2,
  initial: 'Repo crystal source ready',
  charged: 'Player 1 crystal paddle charged',
  released: 'Player 1 released the crystal beam',
};
assert.doesNotThrow(() => assertInteractionDom(`<pre id="result">${JSON.stringify(result).replaceAll('"', '&quot;')}</pre>`));
assert.throws(() => assertInteractionDom('<pre id="result">pending</pre>'), /Unexpected token|mismatch/u);

const makefile = fs.readFileSync(path.join(__dirname, '..', 'Makefile'), 'utf8');
assert.ok(makefile.includes('scripts/test-browser-smoke.js'));
assert.ok(makefile.includes('scripts/smoke-browser.js'));

console.log('browser smoke contract tests passed');
