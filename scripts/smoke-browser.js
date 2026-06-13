#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'poe-source');
const chromeTimeoutMs = 30000;
const chromeCandidates = [
  process.env.CHROME_BIN,
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
].filter(Boolean);

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
]);

const harnessHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; frame-src 'self'; object-src 'none'">
  <title>Proof browser smoke</title>
  <style>
    html, body { width: 100%; height: 100%; margin: 0; }
    #proof { display: block; width: 100vw; height: 100vh; border: 0; }
  </style>
</head>
<body>
  <iframe id="proof" src="/index.html" title="Proof"></iframe>
  <pre id="result">pending</pre>
  <script src="/__smoke__.js"></script>
</body>
</html>`;

const harnessScript = `(() => {
  'use strict';
  const frame = document.getElementById('proof');
  const result = document.getElementById('result');
  let complete = false;
  const geometry = (element) => {
    const rect = element.getBoundingClientRect();
    const style = frame.contentWindow.getComputedStyle(element);
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
    };
  };
  const run = () => {
    if (complete) return;
    try {
      const proof = frame.contentDocument;
      const buttons = proof.querySelectorAll('[data-demo-action]');
      const status = proof.getElementById('status');
      if (!status || buttons.length !== 2) return;
      complete = true;
      const initial = status.textContent;
      buttons[0].click();
      const charged = status.textContent;
      buttons[1].click();
      const released = status.textContent;
      result.textContent = JSON.stringify({
        buttonCount: buttons.length,
        initial,
        charged,
        released,
        viewport: { width: frame.contentWindow.innerWidth, height: frame.contentWindow.innerHeight },
        status: geometry(status),
        buttons: Array.from(buttons, geometry),
      });
    } catch (error) {
      result.textContent = JSON.stringify({ error: error.message });
    }
  };
  frame.addEventListener('load', run);
  if (frame.contentDocument && frame.contentDocument.readyState === 'complete') run();
})();`;

const blankHtml = '<!doctype html><html><head><meta charset="utf-8"><title>Blank</title></head><body></body></html>';

function send(response, status, contentType, body) {
  response.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store' });
  response.end(body);
}

function createServer() {
  return http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
    } catch (error) {
      send(response, 400, 'text/plain; charset=utf-8', 'Bad request');
      return;
    }

    if (pathname === '/__smoke__.html') return send(response, 200, contentTypes.get('.html'), harnessHtml);
    if (pathname === '/__smoke__.js') return send(response, 200, contentTypes.get('.js'), harnessScript);
    if (pathname === '/__blank.html') return send(response, 200, contentTypes.get('.html'), blankHtml);

    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(sourceRoot, relativePath);
    if (filePath !== sourceRoot && !filePath.startsWith(`${sourceRoot}${path.sep}`)) {
      send(response, 403, 'text/plain; charset=utf-8', 'Forbidden');
      return;
    }

    fs.readFile(filePath, (error, contents) => {
      if (error) {
        send(response, error.code === 'ENOENT' ? 404 : 500, 'text/plain; charset=utf-8', error.code || 'Read error');
        return;
      }
      send(response, 200, contentTypes.get(path.extname(filePath)) || 'application/octet-stream', contents);
    });
  });
}

function findChrome() {
  for (const candidate of chromeCandidates) {
    const result = childProcess.spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (!result.error && result.status === 0) return candidate;
  }
  throw new Error(`Chrome or Chromium is required; checked: ${chromeCandidates.join(', ')}`);
}

function chromeProfilePath(outputRoot, invocation) {
  return path.join(outputRoot, `chrome-profile-${invocation}`);
}

function runChrome(chrome, args) {
  return new Promise((resolve, reject) => {
    const processHandle = childProcess.spawn(chrome, [
      '--headless',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-first-run',
      '--no-sandbox',
      ...args,
    ]);
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      processHandle.kill('SIGKILL');
    }, chromeTimeoutMs);
    processHandle.stdout.setEncoding('utf8');
    processHandle.stderr.setEncoding('utf8');
    processHandle.stdout.on('data', (chunk) => { stdout += chunk; });
    processHandle.stderr.on('data', (chunk) => { stderr += chunk; });
    processHandle.on('error', reject);
    processHandle.on('close', (status, signal) => {
      clearTimeout(timeout);
      if (timedOut) reject(new Error(`Chrome timed out after ${chromeTimeoutMs}ms`));
      else if (status !== 0) reject(new Error(`Chrome exited with ${signal || `status ${status}`}: ${stderr.trim()}`));
      else resolve(stdout);
    });
  });
}

function parsePngDimensions(contents) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (contents.length < 24 || !contents.subarray(0, 8).equals(signature) || contents.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('Screenshot is not a valid PNG with an IHDR header');
  }
  return { width: contents.readUInt32BE(16), height: contents.readUInt32BE(20) };
}

function assertVisibleInsideViewport(name, geometry, viewport) {
  const numericFields = ['left', 'top', 'right', 'bottom', 'width', 'height'];
  if (!geometry || numericFields.some((field) => !Number.isFinite(geometry[field]))) {
    throw new Error(`${name} geometry is malformed`);
  }
  const opacity = Number(geometry.opacity);
  const widthMatches = Math.abs((geometry.right - geometry.left) - geometry.width) < 0.01;
  const heightMatches = Math.abs((geometry.bottom - geometry.top) - geometry.height) < 0.01;
  if (!widthMatches || !heightMatches || !Number.isFinite(opacity)) {
    throw new Error(`${name} geometry is malformed`);
  }
  if (geometry.display === 'none' || geometry.visibility !== 'visible' || opacity <= 0) {
    throw new Error(`${name} is not visibly rendered`);
  }
  if (
    geometry.width <= 0 ||
    geometry.height <= 0 ||
    geometry.left < 0 ||
    geometry.top < 0 ||
    geometry.right > viewport.width ||
    geometry.bottom > viewport.height
  ) {
    throw new Error(`${name} is outside the ${viewport.width}x${viewport.height} viewport`);
  }
}

function assertResponsiveLayout(result, expectedViewport) {
  if (!result.viewport || result.viewport.width !== expectedViewport.width || result.viewport.height !== expectedViewport.height) {
    throw new Error(`Browser viewport mismatch: ${JSON.stringify(result.viewport)}`);
  }
  if (!Array.isArray(result.buttons) || result.buttons.length !== 2) {
    throw new Error('Browser layout must include exactly two button rectangles');
  }

  assertVisibleInsideViewport('status', result.status, expectedViewport);
  result.buttons.forEach((button, index) => {
    assertVisibleInsideViewport(`button ${index + 1}`, button, expectedViewport);
    if (button.height < 44) throw new Error(`button ${index + 1} height is below 44 pixels`);
  });

  const [first, second] = result.buttons;
  const overlaps = first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
  if (overlaps) throw new Error('Browser action buttons overlap');
}

function assertInteractionDom(dom, expectedViewport) {
  const match = dom.match(/<pre id="result">([^<]+)<\/pre>/u);
  if (!match) throw new Error('Browser smoke result element is missing');
  const result = JSON.parse(match[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  const expectedInteraction = {
    buttonCount: result.buttonCount,
    initial: result.initial,
    charged: result.charged,
    released: result.released,
  };
  const expected = {
    buttonCount: 2,
    initial: 'Repo crystal source ready',
    charged: 'Player 1 crystal paddle charged',
    released: 'Player 1 released the crystal beam',
  };
  if (JSON.stringify(expectedInteraction) !== JSON.stringify(expected)) {
    throw new Error(`Browser interaction result mismatch: ${JSON.stringify(result)}`);
  }
  assertResponsiveLayout(result, expectedViewport);
}

async function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function close(server) {
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function main() {
  const chrome = findChrome();
  const server = createServer();
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'remix-proof-browser-'));
  let chromeInvocation = 0;
  const runIsolatedChrome = (args) => runChrome(chrome, [
    `--user-data-dir=${chromeProfilePath(outputRoot, chromeInvocation++)}`,
    ...args,
  ]);
  try {
    const port = await listen(server);
    const baseUrl = `http://127.0.0.1:${port}`;
    for (const [name, width, height] of [['desktop', 1280, 720], ['mobile', 390, 844]]) {
      const viewport = { width, height };
      const dom = await runIsolatedChrome([`--window-size=${width},${height}`, '--dump-dom', `${baseUrl}/__smoke__.html`]);
      assertInteractionDom(dom, viewport);
      const screenshotPath = path.join(outputRoot, `${name}.png`);
      const blankPath = path.join(outputRoot, `${name}-blank.png`);
      await runIsolatedChrome([`--window-size=${width},${height}`, `--screenshot=${screenshotPath}`, `${baseUrl}/index.html`]);
      await runIsolatedChrome([`--window-size=${width},${height}`, `--screenshot=${blankPath}`, `${baseUrl}/__blank.html`]);
      const screenshot = fs.readFileSync(screenshotPath);
      const blank = fs.readFileSync(blankPath);
      const dimensions = parsePngDimensions(screenshot);
      if (dimensions.width !== width || dimensions.height !== height) {
        throw new Error(`${name} screenshot dimensions are ${dimensions.width}x${dimensions.height}, expected ${width}x${height}`);
      }
      if (crypto.createHash('sha256').update(screenshot).digest('hex') === crypto.createHash('sha256').update(blank).digest('hex')) {
        throw new Error(`${name} screenshot matches a blank page`);
      }
    }
    process.stdout.write('Real-browser proof smoke passed for both actions, responsive layout, and desktop/mobile screenshots.\n');
  } finally {
    await close(server).catch(() => {});
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}

module.exports = { assertInteractionDom, assertResponsiveLayout, chromeProfilePath, parsePngDimensions };
