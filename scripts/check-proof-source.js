#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { isContainedRegularFile, isPathContained, isValidIsoCalendarDate } = require('./proof-file-contract');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'poe-source');
const manifestPath = path.join(sourceRoot, 'PACKAGE_MANIFEST.json');
const plansRoot = path.join(root, 'docs', 'plans');
const canonicalPlanPath = path.join(plansRoot, '2026-06-08-remix-tui-source-proof-baseline.md');
const ciPlanPath = path.join(plansRoot, '2026-06-10-ci-baseline.md');
const hostedValidationPlanPath = path.join(plansRoot, '2026-06-10-hosted-proof-validation.md');
const hostedValidationWorkflowPath = path.join(root, '.github', 'workflows', 'check.yml');
const browserSmokePath = path.join(root, 'scripts', 'smoke-browser.js');
const browserSmokeTestPath = path.join(root, 'scripts', 'test-browser-smoke.js');
const browserIsolationPlanPath = path.join(plansRoot, '2026-06-13-browser-smoke-process-isolation.md');
const responsiveLayoutPlanPath = path.join(plansRoot, '2026-06-13-responsive-browser-layout.md');
const screenshotBaselinePlanPath = path.join(plansRoot, '2026-06-13-screenshot-baseline-integrity.md');
const makeRootOverridePlanPath = path.join(plansRoot, '2026-06-14-make-root-override-protection.md');
const safeMakeAuthorityPlanPath = path.join(plansRoot, '2026-06-21-safe-make-authority.md');
const chromeDiscoveryTimeoutPlanPath = path.join(plansRoot, '2026-06-17-chrome-discovery-timeout.md');
const expectedSecurityPolicy = "default-src 'self'; script-src 'self'; style-src 'self'; base-uri 'none'; object-src 'none'";
const failures = [];
let expectedDemoSummary = 'Repo crystal rally source complete';

function rel(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function sha256Hex(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sourcePathFor(reference) {
  return path.resolve(sourceRoot, reference);
}

function staysWithinSourceRoot(filePath) {
  return isPathContained(sourceRoot, filePath);
}

function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(entryPath);
    }
    return [entryPath];
  });
}

if (!isContainedRegularFile(sourceRoot, manifestPath)) {
  failures.push('poe-source/PACKAGE_MANIFEST.json must be a contained regular file');
} else {
  let manifest;
  try {
    manifest = JSON.parse(readText(manifestPath));
  } catch (error) {
    failures.push(`poe-source/PACKAGE_MANIFEST.json is invalid JSON: ${error.message}`);
  }

  if (manifest) {
    const requiredManifestFields = {
      name: 'Repo Crystal Rally',
      sourceRoot: 'poe-source',
      entrypoint: 'index.html',
    };
    Object.entries(requiredManifestFields).forEach(([field, expectedValue]) => {
      if (manifest[field] !== expectedValue) {
        failures.push(`poe-source/PACKAGE_MANIFEST.json must set ${field} to ${JSON.stringify(expectedValue)}`);
      }
    });

    if (!isValidIsoCalendarDate(manifest.generatedAt)) {
      failures.push('poe-source/PACKAGE_MANIFEST.json must include generatedAt as a valid YYYY-MM-DD calendar date');
    }

    if (typeof manifest.expectedDemoSummary !== 'string' || manifest.expectedDemoSummary.trim() === '') {
      failures.push('poe-source/PACKAGE_MANIFEST.json must include a non-empty expectedDemoSummary');
    } else {
      expectedDemoSummary = manifest.expectedDemoSummary;
    }

    if (manifest.securityPolicy !== expectedSecurityPolicy) {
      failures.push('poe-source/PACKAGE_MANIFEST.json must include the expected self-only securityPolicy');
    }

    const manifestFiles = Array.isArray(manifest.files) ? manifest.files : [];
    if (manifestFiles.length === 0 || manifestFiles.some((file) => typeof file !== 'string' || file.trim() === '')) {
      failures.push('poe-source/PACKAGE_MANIFEST.json must contain a non-empty string files array');
    }

    manifestFiles.forEach((file) => {
      const filePath = sourcePathFor(file);
      if (!staysWithinSourceRoot(filePath)) {
        failures.push(`manifest file ${file} must stay within poe-source`);
        return;
      }
      if (!isContainedRegularFile(sourceRoot, filePath)) {
        failures.push(`manifest file ${file} must be a contained regular file without symlinks`);
      }
    });

    const digestFiles = manifestFiles.filter((file) => file !== 'PACKAGE_MANIFEST.json');
    const fileDigests = manifest.fileDigests;
    if (!fileDigests || typeof fileDigests !== 'object' || Array.isArray(fileDigests)) {
      failures.push('poe-source/PACKAGE_MANIFEST.json must include a fileDigests object for non-manifest files');
    } else {
      digestFiles.forEach((file) => {
        const expectedDigest = fileDigests[file];
        const filePath = sourcePathFor(file);
        if (typeof expectedDigest !== 'string' || !/^[a-f0-9]{64}$/.test(expectedDigest)) {
          failures.push(`manifest fileDigests must include a SHA-256 hex digest for ${file}`);
          return;
        }
        if (
          staysWithinSourceRoot(filePath) &&
          isContainedRegularFile(sourceRoot, filePath) &&
          sha256Hex(filePath) !== expectedDigest
        ) {
          failures.push(`manifest digest for ${file} does not match checked-in file contents`);
        }
      });

      Object.keys(fileDigests)
        .filter((file) => !digestFiles.includes(file))
        .forEach((file) => {
          failures.push(`manifest fileDigests includes unexpected file ${file}`);
        });
    }

    const actualFiles = walkFiles(sourceRoot)
      .map((filePath) => path.relative(sourceRoot, filePath).replaceAll(path.sep, '/'))
      .sort();
    const listedFiles = [...manifestFiles].sort();
    if (JSON.stringify(actualFiles) !== JSON.stringify(listedFiles)) {
      failures.push(`manifest files ${JSON.stringify(listedFiles)} do not match source files ${JSON.stringify(actualFiles)}`);
    }
  }
}

if (!fs.existsSync(canonicalPlanPath)) {
  failures.push('docs/plans/2026-06-08-remix-tui-source-proof-baseline.md is missing');
}

if (!fs.existsSync(ciPlanPath)) {
  failures.push('docs/plans/2026-06-10-ci-baseline.md is missing');
}

if (!fs.existsSync(hostedValidationPlanPath)) {
  failures.push('docs/plans/2026-06-10-hosted-proof-validation.md is missing');
}

if (!fs.existsSync(hostedValidationWorkflowPath)) {
  failures.push('.github/workflows/check.yml is missing');
} else {
  const workflow = readText(hostedValidationWorkflowPath);
  const expectedWorkflow = [
    'name: Check',
    '',
    'on:',
    '  push:',
    '  pull_request:',
    '  workflow_dispatch:',
    '',
    'permissions:',
    '  contents: read',
    '',
    'concurrency:',
    '  group: check-${{ github.workflow }}-${{ github.ref }}',
    '  cancel-in-progress: true',
    '',
    'jobs:',
    '  proof:',
    '    name: Node ${{ matrix.node-version }}',
    '    runs-on: ubuntu-24.04',
    '    timeout-minutes: 5',
    '    strategy:',
    '      fail-fast: false',
    '      matrix:',
    '        node-version: [20, 24]',
    '    steps:',
    '      - name: Check out repository',
    '        uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6.0.3',
    '        with:',
    '          persist-credentials: false',
    '',
    '      - name: Set up Node.js',
    '        uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0',
    '        with:',
    '          node-version: ${{ matrix.node-version }}',
    '',
    '      - name: Require hosted Chrome',
    '        run: google-chrome --version',
    '',
    '      - name: Validate proof source',
    '        run: CHROME_BIN=google-chrome make check',
    '',
  ].join('\n');
  if (workflow !== expectedWorkflow) {
    failures.push('.github/workflows/check.yml must match the reviewed credential-free contract');
  }
}

for (const browserPath of [browserSmokePath, browserSmokeTestPath]) {
  if (!isContainedRegularFile(root, browserPath)) {
    failures.push(`${rel(browserPath)} must be a contained regular file without symlinks`);
  }
}

if (!fs.existsSync(browserIsolationPlanPath)) {
  failures.push('docs/plans/2026-06-13-browser-smoke-process-isolation.md is missing');
}

if (!fs.existsSync(responsiveLayoutPlanPath)) {
  failures.push('docs/plans/2026-06-13-responsive-browser-layout.md is missing');
}

if (!fs.existsSync(screenshotBaselinePlanPath)) {
  failures.push('docs/plans/2026-06-13-screenshot-baseline-integrity.md is missing');
} else {
  const screenshotBaselinePlan = readText(screenshotBaselinePlanPath);
  [
    '`CHROME_BIN=google-chrome make check` passed',
    'external-directory `make check` passed',
    'rejected all eight hostile mutations',
    'Node 20.20.2 and Node 24.16.0',
    'do not contain Make or Git',
  ].forEach((evidence) => {
    if (!screenshotBaselinePlan.includes(evidence)) {
      failures.push(`screenshot baseline plan must record verification evidence: ${evidence}`);
    }
  });
}

if (fs.existsSync(browserSmokePath)) {
  const browserSmoke = readText(browserSmokePath);
  [
    'const chromeTimeoutMs = 30000;',
    'function chromeProfilePath(outputRoot, invocation)',
    '`--user-data-dir=${chromeProfilePath(outputRoot, chromeInvocation++)}`',
    'const runIsolatedChrome = (args)',
  ].forEach((fragment) => {
    if (!browserSmoke.includes(fragment)) failures.push(`browser smoke must preserve process isolation: ${fragment}`);
  });

  [
    'const chromeProbeTimeoutMs = 5000;',
    'const maxChromeCandidates = 5;',
    'function resolveExecutable(candidate, searchPath = process.env.PATH || \'\')',
    'function findChrome(candidates = chromeCandidates, probe = childProcess.spawnSync, resolver = resolveExecutable)',
    'fs.realpathSync(executablePath)',
    'fs.accessSync(canonicalPath, fs.constants.X_OK)',
    'timeout: chromeProbeTimeoutMs,',
    "killSignal: 'SIGKILL',",
  ].forEach((fragment) => {
    if (!browserSmoke.includes(fragment)) failures.push(`browser smoke must preserve bounded Chrome discovery: ${fragment}`);
  });
}

if (fs.existsSync(browserSmokeTestPath)) {
  const browserSmokeTest = readText(browserSmokeTestPath);
  ['chromeProfilePath', "'chrome-profile-0'", 'assert.notStrictEqual'].forEach((fragment) => {
    if (!browserSmokeTest.includes(fragment)) failures.push(`browser smoke tests must preserve process isolation: ${fragment}`);
  });
}

if (fs.existsSync(browserSmokePath)) {
  const browserSmoke = readText(browserSmokePath);
  [
    'function assertScreenshotPair(name, screenshot, blank, expectedViewport)',
    "for (const [kind, contents] of [['proof', screenshot], ['blank', blank]])",
    'const dimensions = parsePngDimensions(contents);',
    'assertScreenshotPair(name, screenshot, blank, viewport);',
    'screenshotDigest === blankDigest',
  ].forEach((fragment) => {
    if (!browserSmoke.includes(fragment)) failures.push(`browser smoke must preserve screenshot baseline integrity: ${fragment}`);
  });
}

if (fs.existsSync(browserSmokeTestPath)) {
  const browserSmokeTest = readText(browserSmokeTestPath);
  ['assertScreenshotPair', 'blank screenshot dimensions', 'matches a blank page', 'Buffer.alloc(24)'].forEach((fragment) => {
    if (!browserSmokeTest.includes(fragment)) failures.push(`browser smoke tests must preserve screenshot baseline mutation: ${fragment}`);
  });
}

if (fs.existsSync(browserSmokePath)) {
  const browserSmoke = readText(browserSmokePath);
  [
    'assertResponsiveLayout',
    'button.height < 44',
    'Browser action buttons overlap',
    'function browserHarnessUrl(baseUrl, viewport)',
    'const harnessUrl = browserHarnessUrl(baseUrl, viewport);',
    "['desktop', 1280, 720]",
    "['mobile', 390, 844]",
  ].forEach((fragment) => {
    if (!browserSmoke.includes(fragment)) failures.push(`browser smoke must preserve responsive layout contract: ${fragment}`);
  });
}

if (fs.existsSync(browserSmokeTestPath)) {
  const browserSmokeTest = readText(browserSmokeTestPath);
  ['browserHarnessUrl', 'width=390&height=844', 'viewport mismatch', 'below 44', 'overlap', 'visibly rendered'].forEach((fragment) => {
    if (!browserSmokeTest.includes(fragment)) failures.push(`browser smoke tests must preserve responsive layout mutation: ${fragment}`);
  });

  [
    "['stuck-chrome', 'stuck-chrome', 'working-chrome'",
    "assert.strictEqual(selectedChrome, '/resolved/working-chrome')",
    'chromeProbeTimeoutMs > 0 && chromeProbeTimeoutMs < 30000',
    "call.options.killSignal === 'SIGKILL'",
  ].forEach((fragment) => {
    if (!browserSmokeTest.includes(fragment)) failures.push(`browser smoke tests must preserve Chrome discovery timeout coverage: ${fragment}`);
  });
}

if (fs.existsSync(browserSmokePath)) {
  const browserSmoke = readText(browserSmokePath);
  [
    'const maxBrowserOutputBytes = 1024 * 1024;',
    'const maxScreenshotBytes = 16 * 1024 * 1024;',
    "detached: process.platform !== 'win32'",
    "process.kill(-processHandle.pid, 'SIGKILL')",
    'function readBoundedRegularFile(filePath, { minimumBytes = 0, maximumBytes })',
    "if (request.headers.host !== expectedHost)",
    "if (request.method !== 'GET')",
    'function assertRequestLog(requestLog)',
    "'--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1'",
  ].forEach((fragment) => {
    if (!browserSmoke.includes(fragment)) failures.push(`browser smoke must preserve reviewed ownership bounds: ${fragment}`);
  });
}

if (fs.existsSync(browserSmokeTestPath)) {
  const browserSmokeTest = readText(browserSmokeTestPath);
  [
    'maxBrowserOutputBytes + 1',
    "resolveExecutable('./chrome'",
    "readBoundedRegularFile(linkedArtifact",
    "method: 'POST'",
    "host: `localhost:${port}`",
    "pathname: '/unexpected.js'",
    "pathname: '/favicon.ico', status: 204",
  ].forEach((fragment) => {
    if (!browserSmokeTest.includes(fragment)) failures.push(`browser smoke tests must preserve hostile ownership coverage: ${fragment}`);
  });
}

const makefilePath = path.join(root, 'Makefile');
if (!fs.existsSync(makefilePath)) {
  failures.push('Makefile is missing');
} else {
  const makefile = readText(makefilePath);
  [
    'override SHELL := /bin/sh',
    'override .SHELLFLAGS := -c',
    'override NODE := node',
    'override MAKE := make',
    'ifneq ($(strip $(MAKEFILES)),)',
    '$(error MAKEFILES must be empty; repository verification requires this Makefile to be loaded alone)',
    'ifneq ($(origin MAKEFILE_LIST),file)',
    '$(error MAKEFILE_LIST must not be overridden)',
    'override ROOT := $(shell path=',
    '[ -f "$$path" ] || exit 1',
    'export ROOT',
    '$(error repository Makefile path could not be resolved)',
    '"$$ROOT/scripts/test-makefile-root.sh"',
  ].forEach((fragment) => {
    if (!makefile.includes(fragment)) failures.push(`Makefile must preserve authority contract: ${fragment}`);
  });
  ['scripts/smoke-browser.js', 'scripts/test-browser-smoke.js', '$(MAKE) --no-print-directory --file "$$ROOT/Makefile" browser'].forEach((fragment) => {
    if (!makefile.includes(fragment)) failures.push(`Makefile must preserve real-browser proof command: ${fragment}`);
  });
}

const makeRootTestPath = path.join(root, 'scripts', 'test-makefile-root.sh');
if (!isContainedRegularFile(root, makeRootTestPath)) {
  failures.push('scripts/test-makefile-root.sh must be a contained regular file');
} else {
  const makeRootTest = readText(makeRootTestPath);
  ['77 executed target/authority cases', '2 MAKEFILE_LIST rejections', '1 MAKEFILES rejection', '1 multi-Makefile rejection'].forEach((fragment) => {
    if (!makeRootTest.includes(fragment)) failures.push(`Makefile root test must preserve ${fragment}`);
  });
}

if (fs.existsSync(makeRootOverridePlanPath)) {
  const makeRootOverridePlan = readText(makeRootOverridePlanPath);
  ['Node 20', 'Node 24', 'ROOT=/tmp', 'hostile mutations rejected'].forEach((evidence) => {
    if (!makeRootOverridePlan.includes(evidence)) {
      failures.push(`${rel(makeRootOverridePlanPath)} must preserve completed evidence: ${evidence}`);
    }
  });
} else {
  failures.push(`${rel(makeRootOverridePlanPath)} is missing`);
}

if (fs.existsSync(safeMakeAuthorityPlanPath)) {
  const safeMakeAuthorityPlan = readText(safeMakeAuthorityPlanPath);
  ['77 executed target, root, shell, runtime, and recursive-Make authority cases', 'Both `MAKEFILE_LIST` override channels', '`MAKEFILES` preload', 'ambiguous multiple-Makefile invocation failed closed'].forEach((evidence) => {
    if (!safeMakeAuthorityPlan.includes(evidence)) {
      failures.push(`${rel(safeMakeAuthorityPlanPath)} must preserve completed evidence: ${evidence}`);
    }
  });
} else {
  failures.push(`${rel(safeMakeAuthorityPlanPath)} is missing`);
}

if (fs.existsSync(chromeDiscoveryTimeoutPlanPath)) {
  const chromeDiscoveryTimeoutPlan = readText(chromeDiscoveryTimeoutPlanPath);
  if (!/^## Status: Completed$/mu.test(chromeDiscoveryTimeoutPlan)) {
    failures.push(`${rel(chromeDiscoveryTimeoutPlanPath)} must record completed status`);
  }
  ['5-second', 'SIGKILL', 'hostile mutations', 'make check', 'Exact diff'].forEach((evidence) => {
    if (!chromeDiscoveryTimeoutPlan.includes(evidence)) {
      failures.push(`${rel(chromeDiscoveryTimeoutPlanPath)} must preserve completed evidence: ${evidence}`);
    }
  });
} else {
  failures.push(`${rel(chromeDiscoveryTimeoutPlanPath)} is missing`);
}

for (const relativePath of ['README.md', 'CHANGES.md']) {
  const docsPath = path.join(root, relativePath);
  if (!fs.existsSync(docsPath) || !readText(docsPath).includes('5-second Chrome discovery')) {
    failures.push(`${relativePath} must document the 5-second Chrome discovery bound`);
  }
}

['README.md', 'VISION.md', 'SECURITY.md', 'CHANGES.md'].forEach((relativePath) => {
  const docsPath = path.join(root, relativePath);
  if (!fs.existsSync(docsPath) || !readText(docsPath).includes('GitHub Actions')) {
    failures.push(`${relativePath} must document the GitHub Actions baseline`);
  }
});

['README.md', 'VISION.md', 'SECURITY.md', 'CHANGES.md'].forEach((relativePath) => {
  const docsPath = path.join(root, relativePath);
  const contents = fs.existsSync(docsPath) ? readText(docsPath) : '';
  if (!contents.includes('isolated Chrome profiles') || !contents.includes('30-second')) {
    failures.push(`${relativePath} must document isolated Chrome profiles and the 30-second bound`);
  }
});

['README.md', 'VISION.md', 'SECURITY.md', 'CHANGES.md'].forEach((relativePath) => {
  const docsPath = path.join(root, relativePath);
  if (!fs.existsSync(docsPath) || !readText(docsPath).toLowerCase().includes('real-browser')) {
    failures.push(`${relativePath} must document the real-browser proof smoke`);
  }
});

['make check', 'poe-source', 'secrets'].forEach((guidance) => {
  const agentsPath = path.join(root, 'AGENTS.md');
  if (!fs.existsSync(agentsPath) || !readText(agentsPath).includes(guidance)) {
    failures.push(`AGENTS.md must preserve contributor guidance: ${guidance}`);
  }
});

const gitignorePath = path.join(root, '.gitignore');
const requiredIgnoreEntries = [
  '.env',
  '.env.*',
  '!.env.example',
  '.DS_Store',
  '.idea/',
  '.vscode/',
  '*.iml',
  'node_modules/',
  'dist/',
];
if (!fs.existsSync(gitignorePath)) {
  failures.push('.gitignore is missing');
} else {
  const ignoredEntries = new Set(readText(gitignorePath).split(/\r?\n/));
  requiredIgnoreEntries.forEach((entry) => {
    if (!ignoredEntries.has(entry)) {
      failures.push(`.gitignore must include ${JSON.stringify(entry)}`);
    }
  });
}

try {
  const trackedLocalMetadata = execFileSync(
    'git',
    ['ls-files', '.env', '.env.*', '.idea/**', '.vscode/**', '*.iml'],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
    .split(/\r?\n/)
    .filter((entry) => entry && entry !== '.env.example')
    .join('\n');
  if (trackedLocalMetadata) {
    failures.push(`local secrets or editor metadata must not be tracked: ${trackedLocalMetadata}`);
  }
} catch (error) {
  failures.push('proof validation must be able to inspect tracked secret and editor metadata paths');
}

if (!fs.existsSync(plansRoot)) {
  failures.push('docs/plans must contain at least one completed plan');
} else {
  const docsPlans = fs.readdirSync(plansRoot)
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(plansRoot, file))
    .sort();

  if (docsPlans.length === 0) {
    failures.push('docs/plans must contain at least one completed plan');
  }

  docsPlans.forEach((planPath) => {
    const plan = readText(planPath);
    const statusLines = plan.split(/\r?\n/).filter((line) => /^(?:## )?Status:/.test(line));
    const completedStatus = statusLines.filter((line) => line === 'Status: Completed' || line === '## Status: Completed');
    if (statusLines.length !== 1 || completedStatus.length !== 1 || !plan.includes('make check')) {
      failures.push(`${rel(planPath)} must record completed status and make check verification`);
    }
  });
}

const htmlPath = path.join(sourceRoot, 'index.html');
const cssPath = path.join(sourceRoot, 'assets', 'styles.css');
if (!isContainedRegularFile(sourceRoot, htmlPath)) {
  failures.push('poe-source/index.html must be a contained regular file without symlinks');
} else {
  const html = readText(htmlPath);
  if (!/^<!doctype html>/i.test(html.trim())) {
    failures.push('poe-source/index.html must start with <!doctype html>');
  }
  if (!/<html\b[^>]*\blang=/i.test(html)) {
    failures.push('poe-source/index.html must declare a document language');
  }
  if (!/<meta\b[^>]*charset=/i.test(html)) {
    failures.push('poe-source/index.html must declare a character set');
  }
  if (!/<meta\b[^>]*name=["']viewport["'][^>]*>/i.test(html)) {
    failures.push('poe-source/index.html must declare a viewport meta tag');
  }
  const statusMatch = html.match(/<p\b(?=[^>]*\bid=["']status["'])[^>]*>/i);
  if (!statusMatch) {
    failures.push('poe-source/index.html must include a status message element');
  } else if (
    !/\brole=["']status["']/i.test(statusMatch[0]) ||
    !/\baria-live=["']polite["']/i.test(statusMatch[0]) ||
    !/\baria-atomic=["']true["']/i.test(statusMatch[0])
  ) {
    failures.push('poe-source/index.html status message must be an atomic polite live region');
  }
  const cspMatch = html.match(/<meta\b(?=[^>]*http-equiv=["']Content-Security-Policy["'])(?=[^>]*content=(["'])(.*?)\1)[^>]*>/i);
  if (!cspMatch) {
    failures.push('poe-source/index.html must declare a Content-Security-Policy meta tag');
  } else if (cspMatch[2] !== expectedSecurityPolicy) {
    failures.push('poe-source/index.html must use the expected self-only Content-Security-Policy');
  }

  const linkedFiles = [];
  for (const match of html.matchAll(/<(script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
    const reference = match[2];
    if (/^https?:\/\//i.test(reference) || reference.startsWith('//')) {
      failures.push(`poe-source/index.html must not load remote asset ${reference}`);
      continue;
    }
    linkedFiles.push(reference);
    const normalized = reference.replace(/^\.\//, '');
    const filePath = sourcePathFor(normalized);
    if (!staysWithinSourceRoot(filePath)) {
      failures.push(`poe-source/index.html local asset ${reference} must stay within poe-source`);
      continue;
    }
    if (!isContainedRegularFile(sourceRoot, filePath)) {
      failures.push(`poe-source/index.html asset ${reference} must be a contained regular file without symlinks`);
    }
  }
  if (!linkedFiles.includes('./game.js')) {
    failures.push('poe-source/index.html must load ./game.js');
  }

  const demoButtonMatches = [...html.matchAll(/<button\b(?=[^>]*\bdata-demo-action=["']([^"']+)["'])[^>]*>/gi)];
  if (demoButtonMatches.length === 0) {
    failures.push('poe-source/index.html must include demo action buttons');
  }
  demoButtonMatches.forEach((match) => {
    if (!/\btype=["']button["']/i.test(match[0])) {
      failures.push(`poe-source/index.html demo action button ${match[1]} must declare type="button"`);
    }
    if (!/\baria-controls=["']status["']/i.test(match[0])) {
      failures.push(`poe-source/index.html demo action button ${match[1]} must declare aria-controls="status"`);
    }
  });
}

if (!isContainedRegularFile(sourceRoot, cssPath)) {
  failures.push('poe-source/assets/styles.css must be a contained regular file without symlinks');
} else {
  const css = readText(cssPath);
  const buttonFocusVisibleMatch = css.match(/button:focus-visible\s*\{([^}]*)\}/i);
  if (!buttonFocusVisibleMatch) {
    failures.push('poe-source/assets/styles.css must define a button:focus-visible rule');
  } else {
    const focusVisibleBody = buttonFocusVisibleMatch[1];
    if (!/\boutline\s*:\s*(?!none\b)[^;]+;/i.test(focusVisibleBody)) {
      failures.push('poe-source/assets/styles.css button:focus-visible must keep a visible outline');
    }
    if (!/\boutline-offset\s*:/i.test(focusVisibleBody)) {
      failures.push('poe-source/assets/styles.css button:focus-visible must set outline-offset');
    }
  }
}

const gamePath = path.join(sourceRoot, 'game.js');
if (!isContainedRegularFile(sourceRoot, gamePath)) {
  failures.push('poe-source/game.js must be a contained regular file without symlinks');
} else {
  const sandbox = { globalThis: {} };
  try {
    vm.runInNewContext(readText(gamePath), sandbox, { filename: rel(gamePath) });
    const gameLogic = sandbox.globalThis.GameLogic;
    const result = gameLogic && gameLogic.runDemo();
    if (!result || result.complete !== true || result.summary !== expectedDemoSummary) {
      failures.push('GameLogic.runDemo() must return the documented proof summary');
    }
    if (!gameLogic || typeof gameLogic.statusForAction !== 'function') {
      failures.push('GameLogic.statusForAction(action) must expose demo status text for each action');
    } else {
      const expectedActionStatuses = {
        charge: 'Player 1 crystal paddle charged',
        release: 'Player 1 released the crystal beam',
      };
      Object.entries(expectedActionStatuses).forEach(([action, expectedStatus]) => {
        if (gameLogic.statusForAction(action) !== expectedStatus) {
          failures.push(`GameLogic.statusForAction(${JSON.stringify(action)}) must return ${JSON.stringify(expectedStatus)}`);
        }
      });
      if (gameLogic.statusForAction('unknown-action') !== expectedDemoSummary) {
        failures.push('GameLogic.statusForAction() must fall back to the documented proof summary for unknown actions');
      }
      ['constructor', 'toString', '__proto__'].forEach((action) => {
        if (gameLogic.statusForAction(action) !== expectedDemoSummary) {
          failures.push(`GameLogic.statusForAction(${JSON.stringify(action)}) must ignore inherited object properties`);
        }
      });
    }
    if (!gameLogic || typeof gameLogic.bindDemoActions !== 'function') {
      failures.push('GameLogic.bindDemoActions(document) must wire demo buttons to the status live region');
    } else {
      const handlers = {};
      const statusElement = { textContent: 'Repo crystal source ready' };
      const buttons = ['charge', 'release'].map((action) => ({
        dataset: { demoAction: action },
        addEventListener(eventName, handler) {
          handlers[action] = { eventName, handler };
        },
      }));
      const fakeDocument = {
        getElementById(id) {
          return id === 'status' ? statusElement : null;
        },
        querySelectorAll(selector) {
          return selector === '[data-demo-action]' ? buttons : [];
        },
      };
      gameLogic.bindDemoActions(fakeDocument);
      ['charge', 'release'].forEach((action) => {
        if (!handlers[action] || handlers[action].eventName !== 'click') {
          failures.push(`GameLogic.bindDemoActions(document) must attach a click handler for ${action}`);
          return;
        }
        handlers[action].handler();
        const expectedStatus = gameLogic.statusForAction(action);
        if (statusElement.textContent !== expectedStatus) {
          failures.push(`GameLogic ${action} click handler must update the status live region`);
        }
      });
      [
        null,
        {},
        {
          getElementById() {
            throw new Error('Cannot read status element');
          },
          querySelectorAll() {
            return buttons;
          },
        },
        {
          getElementById() {
            return statusElement;
          },
          querySelectorAll() {
            return null;
          },
        },
        {
          getElementById() {
            return statusElement;
          },
          querySelectorAll() {
            return [{ dataset: { demoAction: 'charge' } }];
          },
        },
      ].forEach((documentRef, index) => {
        try {
          gameLogic.bindDemoActions(documentRef);
        } catch (error) {
          failures.push(`GameLogic.bindDemoActions malformed document case ${index} must not throw`);
        }
      });
    }
  } catch (error) {
    failures.push(`poe-source/game.js failed smoke execution: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`Proof source checks failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Proof source checks passed');
