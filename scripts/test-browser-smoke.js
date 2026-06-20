#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const { PassThrough } = require('stream');
const {
  assertInteractionDom,
  assertRequestLog,
  assertResponsiveLayout,
  assertScreenshotPair,
  browserHarnessUrl,
  chromeProbeTimeoutMs,
  chromeProfilePath,
  close,
  createServer,
  findChrome,
  listen,
  maxBrowserOutputBytes,
  maxChromeCandidates,
  maxScreenshotBytes,
  parsePngDimensions,
  readBoundedRegularFile,
  resolveExecutable,
  runChrome,
} = require('./smoke-browser');

function pngWithDimensions(width, height, marker = 0, size = 64) {
  const contents = Buffer.alloc(size);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(contents, 0);
  contents.write('IHDR', 12, 'ascii');
  contents.writeUInt32BE(width, 16);
  contents.writeUInt32BE(height, 20);
  contents[24] = marker;
  return contents;
}

function request(port, requestPath, options = {}) {
  return new Promise((resolve, reject) => {
    const requestHandle = http.request({
      host: '127.0.0.1',
      port,
      path: requestPath,
      method: options.method || 'GET',
      headers: options.headers || { host: `127.0.0.1:${port}` },
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
    });
    requestHandle.on('error', reject);
    requestHandle.end();
  });
}

function fakeChromeProcess() {
  const processHandle = new EventEmitter();
  processHandle.pid = 4242;
  processHandle.stdout = new PassThrough();
  processHandle.stderr = new PassThrough();
  processHandle.killedWith = [];
  processHandle.kill = (signal) => {
    processHandle.killedWith.push(signal);
    process.nextTick(() => processHandle.emit('close', null, signal));
    return true;
  };
  return processHandle;
}

async function main() {
  const png = pngWithDimensions(1280, 720);
  assert.deepStrictEqual(parsePngDimensions(png), { width: 1280, height: 720 });
  assert.throws(() => parsePngDimensions(Buffer.alloc(24)), /valid PNG/u);
  assert.throws(() => parsePngDimensions(pngWithDimensions(0, 720)), /dimensions/u);
  assert.doesNotThrow(() => assertScreenshotPair('desktop', png, pngWithDimensions(1280, 720, 1), { width: 1280, height: 720 }));
  assert.throws(() => assertScreenshotPair('desktop', png, Buffer.alloc(24), { width: 1280, height: 720 }), /byte limit/u);
  assert.throws(() => assertScreenshotPair('desktop', png, pngWithDimensions(1280, 719, 1), { width: 1280, height: 720 }), /blank screenshot dimensions/u);
  assert.throws(() => assertScreenshotPair('desktop', png, Buffer.from(png), { width: 1280, height: 720 }), /matches a blank page/u);
  assert.throws(
    () => assertScreenshotPair('desktop', pngWithDimensions(1280, 720, 0, maxScreenshotBytes + 1), pngWithDimensions(1280, 720, 1), { width: 1280, height: 720 }),
    /byte limit/u,
  );
  assert.doesNotThrow(() => assertRequestLog([
    { method: 'GET', pathname: '/__smoke__.html', status: 200 },
    { method: 'GET', pathname: '/__smoke__.js', status: 200 },
    { method: 'GET', pathname: '/index.html', status: 200 },
    { method: 'GET', pathname: '/assets/styles.css', status: 200 },
    { method: 'GET', pathname: '/game.js', status: 200 },
    { method: 'GET', pathname: '/__blank.html', status: 200 },
    { method: 'GET', pathname: '/favicon.ico', status: 204 },
  ]));
  assert.throws(() => assertRequestLog([
    { method: 'GET', pathname: '/index.html', status: 500 },
  ]), /non-success/u);
  assert.throws(() => assertRequestLog([
    { method: 'GET', pathname: '/index.html', status: 200 },
    { method: 'GET', pathname: '/unexpected.js', status: 200 },
  ]), /unexpected/u);
  assert.throws(() => assertRequestLog([
    { method: 'GET', pathname: '/index.html', status: 200 },
  ]), /missing/u);

  const hangingChrome = fakeChromeProcess();
  const completedDom = runChrome('/resolved/chrome', ['--dump-dom', 'http://127.0.0.1/'], () => hangingChrome, { timeoutMs: 1000 });
  hangingChrome.stdout.end('<html><body>ok</body></html>');
  assert.strictEqual(await completedDom, '<html><body>ok</body></html>');
  assert.deepStrictEqual(hangingChrome.killedWith, ['SIGKILL']);

  const noisyChrome = fakeChromeProcess();
  const noisyRun = runChrome('/resolved/chrome', ['--dump-dom', 'http://127.0.0.1/'], () => noisyChrome, { timeoutMs: 1000 });
  noisyChrome.stdout.write(Buffer.alloc(maxBrowserOutputBytes + 1, 'x'));
  await assert.rejects(noisyRun, /output limit/u);

  const result = {
    buttonCount: 2,
    initial: 'Repo crystal source ready',
    charged: 'Player 1 crystal paddle charged',
    released: 'Player 1 released the crystal beam',
    viewport: { width: 390, height: 844 },
    resources: ['/assets/styles.css', '/game.js'],
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
  assert.throws(
    () => assertInteractionDom(`<pre id="result">${JSON.stringify({ ...result, resources: ['https://example.com/x.js'] }).replaceAll('"', '&quot;')}</pre>`, mobileViewport),
    /resource mapping/u,
  );

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

  const executableRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-executable-'));
  const executable = path.join(executableRoot, 'chrome');
  fs.writeFileSync(executable, '#!/bin/sh\nexit 0\n', { mode: 0o700 });
  assert.strictEqual(resolveExecutable('chrome', executableRoot), fs.realpathSync(executable));
  assert.throws(() => resolveExecutable('./chrome', executableRoot), /absolute/u);
  const nonExecutable = path.join(executableRoot, 'not-executable');
  fs.writeFileSync(nonExecutable, 'no');
  assert.throws(() => resolveExecutable(nonExecutable, executableRoot), /executable/u);

  const probeCalls = [];
  const selectedChrome = findChrome(
    ['stuck-chrome', 'stuck-chrome', 'working-chrome', ...Array(maxChromeCandidates).fill('ignored-chrome')],
    (candidate, args, options) => {
      probeCalls.push({ candidate, args, options });
      if (candidate.endsWith('stuck-chrome')) return { error: Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' }), status: null };
      return { error: undefined, status: 0 };
    },
    (candidate) => `/resolved/${candidate}`,
  );
  assert.strictEqual(selectedChrome, '/resolved/working-chrome');
  assert.ok(chromeProbeTimeoutMs > 0 && chromeProbeTimeoutMs < 30000);
  assert.deepStrictEqual(probeCalls.map((call) => call.candidate), ['/resolved/stuck-chrome', '/resolved/working-chrome']);
  assert.ok(probeCalls.every((call) => call.options.timeout === chromeProbeTimeoutMs && call.options.killSignal === 'SIGKILL'));
  assert.throws(
    () => findChrome(['missing-chrome'], () => ({ error: new Error('missing'), status: null }), (candidate) => `/resolved/${candidate}`),
    /checked: missing-chrome/u,
  );

  const artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-artifact-'));
  const artifact = path.join(artifactRoot, 'artifact.png');
  fs.writeFileSync(artifact, png);
  assert.deepStrictEqual(readBoundedRegularFile(artifact, { minimumBytes: 64, maximumBytes: 1024 }), png);
  const linkedArtifact = path.join(artifactRoot, 'linked.png');
  fs.symlinkSync(artifact, linkedArtifact);
  assert.throws(() => readBoundedRegularFile(linkedArtifact, { minimumBytes: 1, maximumBytes: 1024 }), /symlink/u);

  const server = createServer();
  const port = await listen(server);
  try {
    const address = server.address();
    assert.deepStrictEqual({ address: address.address, family: address.family }, { address: '127.0.0.1', family: 'IPv4' });
    assert.ok(Number.isInteger(port) && port > 0);
    assert.strictEqual((await request(port, '/index.html')).status, 200);
    assert.strictEqual((await request(port, '/favicon.ico')).status, 204);
    assert.strictEqual((await request(port, '/PACKAGE_MANIFEST.json')).status, 404);
    assert.strictEqual((await request(port, '/index.html', { method: 'POST' })).status, 405);
    assert.strictEqual((await request(port, '/index.html', { headers: { host: `localhost:${port}` } })).status, 403);
    assert.strictEqual((await request(port, '/..%2fREADME.md')).status, 404);
    assert.deepStrictEqual(server.requestLog.map(({ method, pathname, status }) => ({ method, pathname, status })), [
      { method: 'GET', pathname: '/index.html', status: 200 },
      { method: 'GET', pathname: '/favicon.ico', status: 204 },
      { method: 'GET', pathname: '/PACKAGE_MANIFEST.json', status: 404 },
      { method: 'POST', pathname: '/index.html', status: 405 },
      { method: 'GET', pathname: '/index.html', status: 403 },
      { method: 'GET', pathname: '/../README.md', status: 404 },
    ]);
  } finally {
    await close(server);
    fs.rmSync(executableRoot, { recursive: true, force: true });
    fs.rmSync(artifactRoot, { recursive: true, force: true });
  }

  const makefile = fs.readFileSync(path.join(__dirname, '..', 'Makefile'), 'utf8');
  const smokeSource = fs.readFileSync(path.join(__dirname, 'smoke-browser.js'), 'utf8');
  assert.ok(makefile.includes('scripts/test-browser-smoke.js'));
  assert.ok(makefile.includes('scripts/smoke-browser.js'));
  assert.ok(smokeSource.includes('assertScreenshotPair(name, screenshot, blank, viewport);'));

  console.log('browser smoke contract tests passed');
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
