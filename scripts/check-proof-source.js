#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'poe-source');
const manifestPath = path.join(sourceRoot, 'PACKAGE_MANIFEST.json');
const plansRoot = path.join(root, 'docs', 'plans');
const canonicalPlanPath = path.join(plansRoot, '2026-06-08-remix-tui-source-proof-baseline.md');
const hostedValidationPlanPath = path.join(plansRoot, '2026-06-10-hosted-proof-validation.md');
const hostedValidationWorkflowPath = path.join(root, '.github', 'workflows', 'check.yml');
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
  const relativePath = path.relative(sourceRoot, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
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

if (!fs.existsSync(manifestPath)) {
  failures.push('poe-source/PACKAGE_MANIFEST.json is missing');
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

    if (typeof manifest.generatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(manifest.generatedAt)) {
      failures.push('poe-source/PACKAGE_MANIFEST.json must include generatedAt as YYYY-MM-DD');
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
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        failures.push(`manifest lists missing file ${file}`);
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
          fs.existsSync(filePath) &&
          fs.statSync(filePath).isFile() &&
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

if (!fs.existsSync(hostedValidationPlanPath)) {
  failures.push('docs/plans/2026-06-10-hosted-proof-validation.md is missing');
}

if (!fs.existsSync(hostedValidationWorkflowPath)) {
  failures.push('.github/workflows/check.yml is missing');
} else {
  const workflow = readText(hostedValidationWorkflowPath);
  const requiredWorkflowFragments = [
    'runs-on: ubuntu-24.04',
    'permissions:',
    'contents: read',
    'node-version: [20, 24]',
    'uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10',
    'uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e',
    'node-version: ${{ matrix.node-version }}',
    'run: make check',
  ];
  requiredWorkflowFragments.forEach((fragment) => {
    if (!workflow.includes(fragment)) {
      failures.push(`.github/workflows/check.yml must include ${JSON.stringify(fragment)}`);
    }
  });
  for (const match of workflow.matchAll(/^\s*uses:\s*([^@\s]+)@([^\s#]+)/gm)) {
    if (!/^[a-f0-9]{40}$/.test(match[2])) {
      failures.push(`.github/workflows/check.yml action ${match[1]} must be pinned to a full commit SHA`);
    }
  }
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
    if (!plan.includes('Status: Completed') || !plan.includes('make check')) {
      failures.push(`${rel(planPath)} must record completed status and make check verification`);
    }
  });
}

const htmlPath = path.join(sourceRoot, 'index.html');
const cssPath = path.join(sourceRoot, 'assets', 'styles.css');
if (!fs.existsSync(htmlPath)) {
  failures.push('poe-source/index.html is missing');
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
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      failures.push(`poe-source/index.html references missing asset ${reference}`);
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

if (!fs.existsSync(cssPath)) {
  failures.push('poe-source/assets/styles.css is missing');
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
if (!fs.existsSync(gamePath)) {
  failures.push('poe-source/game.js is missing');
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
