#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { isContainedRegularFile } = require('./proof-file-contract');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'poe-source');
const chromeProbeTimeoutMs = 5000;
const chromeTimeoutMs = 30000;
const maxBrowserOutputBytes = 1024 * 1024;
const maxChromeCandidates = 5;
const maxScreenshotBytes = 16 * 1024 * 1024;
const maxSourceBytes = 1024 * 1024;
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

function renderHarnessHtml(width, height) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; frame-src 'self'; object-src 'none'">
  <title>Proof browser smoke</title>
  <style>
    html, body { margin: 0; }
    #proof { display: block; width: ${width}px; height: ${height}px; border: 0; }
  </style>
</head>
<body>
  <iframe id="proof" src="/index.html" title="Proof"></iframe>
  <pre id="result">pending</pre>
  <script src="/__smoke__.js"></script>
</body>
</html>`;
}

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
        resources: frame.contentWindow.performance.getEntriesByType('resource')
          .map((entry) => new URL(entry.name).pathname)
          .sort(),
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

function readBoundedRegularFile(filePath, { minimumBytes = 0, maximumBytes }) {
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink()) throw new Error(`${filePath} must not be a symlink`);
  if (!stat.isFile()) throw new Error(`${filePath} must be a regular file`);
  if (stat.size < minimumBytes) throw new Error(`${filePath} is below the ${minimumBytes}-byte minimum`);
  if (stat.size > maximumBytes) throw new Error(`${filePath} exceeds the ${maximumBytes}-byte limit`);

  const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0);
  const descriptor = fs.openSync(filePath, flags);
  try {
    const openedStat = fs.fstatSync(descriptor);
    if (!openedStat.isFile() || openedStat.size !== stat.size) throw new Error(`${filePath} changed while opening`);
    const contents = Buffer.alloc(openedStat.size);
    let offset = 0;
    while (offset < contents.length) {
      const bytesRead = fs.readSync(descriptor, contents, offset, contents.length - offset, offset);
      if (bytesRead === 0) throw new Error(`${filePath} changed while reading`);
      offset += bytesRead;
    }
    return contents;
  } finally {
    fs.closeSync(descriptor);
  }
}

function loadSourceAllowlist() {
  const manifestPath = path.join(sourceRoot, 'PACKAGE_MANIFEST.json');
  if (!isContainedRegularFile(sourceRoot, manifestPath)) throw new Error('Proof manifest is not a contained regular file');
  const manifest = JSON.parse(readBoundedRegularFile(manifestPath, { maximumBytes: maxSourceBytes }).toString('utf8'));
  if (!Array.isArray(manifest.files)) throw new Error('Proof manifest files are missing');
  return new Map(manifest.files
    .filter((reference) => reference !== 'PACKAGE_MANIFEST.json')
    .map((reference) => [`/${reference.replaceAll(path.sep, '/')}`, path.resolve(sourceRoot, reference)]));
}

function createServer() {
  const allowedFiles = loadSourceAllowlist();
  const server = http.createServer((request, response) => {
    let requestUrl;
    let pathname;
    const respond = (status, contentType, body) => {
      server.requestLog.push({ method: request.method || '', pathname: pathname || request.url || '', status });
      return send(response, status, contentType, body);
    };
    try {
      requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch (error) {
      return respond(400, 'text/plain; charset=utf-8', 'Bad request');
    }

    const address = server.address();
    const expectedHost = address && typeof address === 'object' ? `127.0.0.1:${address.port}` : '';
    if (request.headers.host !== expectedHost) return respond(403, 'text/plain; charset=utf-8', 'Forbidden');
    if (request.method !== 'GET') return respond(405, 'text/plain; charset=utf-8', 'Method not allowed');

    if (pathname === '/__smoke__.html') {
      const width = Number(requestUrl.searchParams.get('width'));
      const height = Number(requestUrl.searchParams.get('height'));
      if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width > 4096 || height > 4096) {
        return respond(400, 'text/plain; charset=utf-8', 'Invalid viewport');
      }
      return respond(200, contentTypes.get('.html'), renderHarnessHtml(width, height));
    }
    if (pathname === '/__smoke__.js') return respond(200, contentTypes.get('.js'), harnessScript);
    if (pathname === '/__blank.html') return respond(200, contentTypes.get('.html'), blankHtml);
    if (pathname === '/favicon.ico') return respond(204, 'image/x-icon', '');

    const sourcePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = allowedFiles.get(sourcePath);
    if (!filePath || !isContainedRegularFile(sourceRoot, filePath)) {
      return respond(404, 'text/plain; charset=utf-8', 'Not found');
    }
    try {
      const contents = readBoundedRegularFile(filePath, { maximumBytes: maxSourceBytes });
      return respond(200, contentTypes.get(path.extname(filePath)) || 'application/octet-stream', contents);
    } catch (error) {
      return respond(500, 'text/plain; charset=utf-8', 'Read error');
    }
  });
  server.requestLog = [];
  return server;
}

function resolveExecutable(candidate, searchPath = process.env.PATH || '') {
  if (typeof candidate !== 'string' || candidate.length === 0 || candidate.includes('\0')) {
    throw new Error('Chrome candidate must be a non-empty path');
  }
  let candidates;
  if (path.isAbsolute(candidate)) {
    candidates = [candidate];
  } else {
    if (candidate.includes('/') || candidate.includes('\\')) throw new Error('Chrome candidate paths must be absolute');
    candidates = searchPath.split(path.delimiter)
      .filter((directory) => directory && path.isAbsolute(directory))
      .map((directory) => path.join(directory, candidate));
  }

  for (const executablePath of candidates) {
    try {
      const canonicalPath = fs.realpathSync(executablePath);
      if (!fs.statSync(canonicalPath).isFile()) continue;
      fs.accessSync(canonicalPath, fs.constants.X_OK);
      return canonicalPath;
    } catch (error) {
      continue;
    }
  }
  throw new Error(`Chrome candidate is not an executable regular file: ${candidate}`);
}

function findChrome(candidates = chromeCandidates, probe = childProcess.spawnSync, resolver = resolveExecutable) {
  const uniqueCandidates = [...new Set(candidates)].slice(0, maxChromeCandidates);
  for (const candidate of uniqueCandidates) {
    let executablePath;
    try {
      executablePath = resolver(candidate);
    } catch (error) {
      continue;
    }
    const result = probe(executablePath, ['--version'], {
      encoding: 'utf8',
      timeout: chromeProbeTimeoutMs,
      killSignal: 'SIGKILL',
    });
    if (!result.error && result.status === 0) return executablePath;
  }
  throw new Error(`Chrome or Chromium is required; checked: ${uniqueCandidates.join(', ')}`);
}

function chromeProfilePath(outputRoot, invocation) {
  return path.join(outputRoot, `chrome-profile-${invocation}`);
}

function browserHarnessUrl(baseUrl, viewport) {
  const url = new URL('/__smoke__.html', baseUrl);
  url.searchParams.set('width', String(viewport.width));
  url.searchParams.set('height', String(viewport.height));
  return url.toString();
}

function runChrome(chrome, args, spawn = childProcess.spawn, options = {}) {
  return new Promise((resolve, reject) => {
    const timeoutMs = options.timeoutMs || chromeTimeoutMs;
    const processHandle = spawn(chrome, [
      '--headless',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-gpu',
      '--disable-sync',
      '--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1',
      '--metrics-recording-only',
      '--no-first-run',
      '--no-sandbox',
      ...args,
    ], {
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let completionDetected = false;
    let failure;
    let settled = false;
    const terminate = () => {
      if (process.platform !== 'win32' && Number.isInteger(processHandle.pid)) {
        try {
          process.kill(-processHandle.pid, 'SIGKILL');
          return;
        } catch (error) {
        }
      }
      try {
        processHandle.kill('SIGKILL');
      } catch (error) {
      }
    };
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };
    const append = (current, chunk) => {
      if (Buffer.byteLength(current) + Buffer.byteLength(chunk) > maxBrowserOutputBytes) {
        failure = new Error(`Chrome output exceeds the ${maxBrowserOutputBytes}-byte output limit`);
        terminate();
        return current;
      }
      return current + chunk;
    };
    const detectCompletion = () => {
      if (completionDetected || failure) return;
      const dumpedDom = args.includes('--dump-dom') && stdout.includes('</html>');
      const wroteScreenshot = args.some((argument) => argument.startsWith('--screenshot=')) && /bytes written to file/u.test(stderr);
      if (dumpedDom || wroteScreenshot) {
        completionDetected = true;
        terminate();
      }
    };
    const timeout = setTimeout(() => {
      failure = new Error(`Chrome timed out after ${timeoutMs}ms: ${stderr.trim().slice(0, 512)}`);
      terminate();
    }, timeoutMs);
    processHandle.stdout.setEncoding('utf8');
    processHandle.stderr.setEncoding('utf8');
    processHandle.stdout.on('data', (chunk) => {
      stdout = append(stdout, chunk);
      detectCompletion();
    });
    processHandle.stderr.on('data', (chunk) => {
      stderr = append(stderr, chunk);
      detectCompletion();
    });
    processHandle.on('error', (error) => finish(() => reject(error)));
    processHandle.on('close', (status, signal) => {
      finish(() => {
        if (failure) reject(failure);
        else if (completionDetected || status === 0) resolve(stdout);
        else reject(new Error(`Chrome exited with ${signal || `status ${status}`}: ${stderr.trim().slice(0, 2048)}`));
      });
    });
  });
}

function parsePngDimensions(contents) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (contents.length < 24 || !contents.subarray(0, 8).equals(signature) || contents.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('Screenshot is not a valid PNG with an IHDR header');
  }
  const dimensions = { width: contents.readUInt32BE(16), height: contents.readUInt32BE(20) };
  if (dimensions.width === 0 || dimensions.height === 0 || dimensions.width > 4096 || dimensions.height > 4096) {
    throw new Error(`Screenshot dimensions are invalid: ${dimensions.width}x${dimensions.height}`);
  }
  return dimensions;
}

function assertScreenshotPair(name, screenshot, blank, expectedViewport) {
  for (const [kind, contents] of [['proof', screenshot], ['blank', blank]]) {
    if (contents.length < 64 || contents.length > maxScreenshotBytes) {
      throw new Error(`${name} ${kind} screenshot violates the 64-${maxScreenshotBytes} byte limit`);
    }
    const dimensions = parsePngDimensions(contents);
    if (dimensions.width !== expectedViewport.width || dimensions.height !== expectedViewport.height) {
      throw new Error(
        `${name} ${kind} screenshot dimensions are ${dimensions.width}x${dimensions.height}, ` +
        `expected ${expectedViewport.width}x${expectedViewport.height}`,
      );
    }
  }

  const screenshotDigest = crypto.createHash('sha256').update(screenshot).digest('hex');
  const blankDigest = crypto.createHash('sha256').update(blank).digest('hex');
  if (screenshotDigest === blankDigest) throw new Error(`${name} screenshot matches a blank page`);
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
  if (JSON.stringify(result.resources) !== JSON.stringify(['/assets/styles.css', '/game.js'])) {
    throw new Error(`Browser resource mapping mismatch: ${JSON.stringify(result.resources)}`);
  }
  assertResponsiveLayout(result, expectedViewport);
}

function assertRequestLog(requestLog) {
  const allowedPaths = new Set([
    '/__blank.html',
    '/__smoke__.html',
    '/__smoke__.js',
    '/assets/styles.css',
    '/game.js',
    '/index.html',
  ]);
  const requiredPaths = new Set(allowedPaths);
  for (const request of requestLog) {
    const optionalFavicon = request.pathname === '/favicon.ico' && request.status === 204;
    if (request.method !== 'GET' || (request.status !== 200 && !optionalFavicon)) {
      throw new Error(`Browser navigation recorded a non-success request: ${JSON.stringify(request)}`);
    }
    if (optionalFavicon) continue;
    if (!allowedPaths.has(request.pathname)) {
      throw new Error(`Browser navigation recorded an unexpected request: ${request.pathname}`);
    }
    requiredPaths.delete(request.pathname);
  }
  if (requiredPaths.size > 0) {
    throw new Error(`Browser navigation is missing required requests: ${[...requiredPaths].join(', ')}`);
  }
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
      const harnessUrl = browserHarnessUrl(baseUrl, viewport);
      const dom = await runIsolatedChrome([`--window-size=${width},${height}`, '--dump-dom', harnessUrl]);
      assertInteractionDom(dom, viewport);
      const screenshotPath = path.join(outputRoot, `${name}.png`);
      const blankPath = path.join(outputRoot, `${name}-blank.png`);
      await runIsolatedChrome([`--window-size=${width},${height}`, `--screenshot=${screenshotPath}`, `${baseUrl}/index.html`]);
      await runIsolatedChrome([`--window-size=${width},${height}`, `--screenshot=${blankPath}`, `${baseUrl}/__blank.html`]);
      const screenshot = readBoundedRegularFile(screenshotPath, { minimumBytes: 64, maximumBytes: maxScreenshotBytes });
      const blank = readBoundedRegularFile(blankPath, { minimumBytes: 64, maximumBytes: maxScreenshotBytes });
      assertScreenshotPair(name, screenshot, blank, viewport);
    }
    assertRequestLog(server.requestLog);
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

module.exports = {
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
};
