#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  assertInteractionDom,
  assertResponsiveLayout,
  assertScreenshotPair,
  browserHarnessUrl,
  chromeProbeTimeoutMs,
  chromeProfilePath,
  findChrome,
  parsePngDimensions,
} = require('./smoke-browser');

function pngWithDimensions(width, height, marker = 0) {
  const contents = Buffer.alloc(25);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(contents, 0);
  contents.write('IHDR', 12, 'ascii');
  contents.writeUInt32BE(width, 16);
  contents.writeUInt32BE(height, 20);
  contents[24] = marker;
  return contents;
}

const png = pngWithDimensions(1280, 720);
assert.deepStrictEqual(parsePngDimensions(png), { width: 1280, height: 720 });
assert.throws(() => parsePngDimensions(Buffer.alloc(24)), /valid PNG/u);
assert.doesNotThrow(() => assertScreenshotPair('desktop', png, pngWithDimensions(1280, 720, 1), { width: 1280, height: 720 }));
assert.throws(() => assertScreenshotPair('desktop', png, Buffer.alloc(24), { width: 1280, height: 720 }), /valid PNG/u);
assert.throws(() => assertScreenshotPair('desktop', png, pngWithDimensions(1280, 719, 1), { width: 1280, height: 720 }), /blank screenshot dimensions/u);
assert.throws(() => assertScreenshotPair('desktop', png, Buffer.from(png), { width: 1280, height: 720 }), /matches a blank page/u);

const result = {
  buttonCount: 2,
  initial: 'Repo crystal source ready',
  charged: 'Player 1 crystal paddle charged',
  released: 'Player 1 released the crystal beam',
  viewport: { width: 390, height: 844 },
  status: {
    left: 8, top: 100, right: 382, bottom: 120, width: 374, height: 20,
    display: 'block', visibility: 'visible', opacity: '1',
  },
  buttons: [
    {
      left: 8, top: 140, right: 120, bottom: 184, width: 112, height: 44,
      display: 'inline-block', visibility: 'visible', opacity: '1',
    },
    {
      left: 124, top: 140, right: 250, bottom: 184, width: 126, height: 44,
      display: 'inline-block', visibility: 'visible', opacity: '1',
    },
  ],
};
const mobileViewport = { width: 390, height: 844 };
assert.doesNotThrow(() => assertInteractionDom(`<pre id="result">${JSON.stringify(result).replaceAll('"', '&quot;')}</pre>`, mobileViewport));
assert.throws(() => assertInteractionDom('<pre id="result">pending</pre>'), /Unexpected token|mismatch/u);

assert.throws(() => assertResponsiveLayout({ ...result, viewport: { width: 391, height: 844 } }, mobileViewport), /viewport mismatch/u);
assert.throws(() => assertResponsiveLayout({ ...result, status: { ...result.status, right: 400, width: 392 } }, mobileViewport), /outside/u);
assert.throws(() => assertResponsiveLayout({ ...result, buttons: [{ ...result.buttons[0], bottom: 183, height: 43 }, result.buttons[1]] }, mobileViewport), /below 44/u);
assert.throws(() => assertResponsiveLayout({ ...result, buttons: [result.buttons[0], { ...result.buttons[1], left: 100, right: 226 }] }, mobileViewport), /overlap/u);
assert.throws(() => assertResponsiveLayout({ ...result, buttons: [{ ...result.buttons[0], visibility: 'hidden' }, result.buttons[1]] }, mobileViewport), /visibly rendered/u);
assert.throws(() => assertResponsiveLayout({ ...result, status: { ...result.status, width: 1 } }, mobileViewport), /malformed/u);

assert.strictEqual(chromeProfilePath('/tmp/proof', 0), path.join('/tmp/proof', 'chrome-profile-0'));
assert.notStrictEqual(chromeProfilePath('/tmp/proof', 0), chromeProfilePath('/tmp/proof', 1));
assert.strictEqual(
  browserHarnessUrl('http://127.0.0.1:3000', mobileViewport),
  'http://127.0.0.1:3000/__smoke__.html?width=390&height=844',
);

const probeCalls = [];
const selectedChrome = findChrome(['stuck-chrome', 'working-chrome'], (candidate, args, options) => {
  probeCalls.push({ candidate, args, options });
  if (candidate === 'stuck-chrome') return { error: Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' }), status: null };
  return { error: undefined, status: 0 };
});
assert.strictEqual(selectedChrome, 'working-chrome');
assert.ok(chromeProbeTimeoutMs > 0 && chromeProbeTimeoutMs < 30000);
assert.deepStrictEqual(probeCalls, [
  {
    candidate: 'stuck-chrome',
    args: ['--version'],
    options: { encoding: 'utf8', timeout: chromeProbeTimeoutMs, killSignal: 'SIGKILL' },
  },
  {
    candidate: 'working-chrome',
    args: ['--version'],
    options: { encoding: 'utf8', timeout: chromeProbeTimeoutMs, killSignal: 'SIGKILL' },
  },
]);
assert.throws(
  () => findChrome(['missing-chrome'], () => ({ error: new Error('missing'), status: null })),
  /checked: missing-chrome/u,
);

const makefile = fs.readFileSync(path.join(__dirname, '..', 'Makefile'), 'utf8');
const smokeSource = fs.readFileSync(path.join(__dirname, 'smoke-browser.js'), 'utf8');
assert.ok(makefile.includes('scripts/test-browser-smoke.js'));
assert.ok(makefile.includes('scripts/smoke-browser.js'));
assert.ok(smokeSource.includes('assertScreenshotPair(name, screenshot, blank, viewport);'));

console.log('browser smoke contract tests passed');
