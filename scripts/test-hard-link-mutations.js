#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mutations = [
  {
    label: 'shared file link-count guard',
    file: 'scripts/proof-file-contract.js',
    original: ' || fileStat.nlink !== 1',
    replacement: '',
    command: ['node', 'scripts/test-proof-file-contract.js'],
  },
  {
    label: 'browser pre-open link-count guard',
    file: 'scripts/smoke-browser.js',
    original: '  if (stat.nlink !== 1) throw new Error(`${filePath} must not be a hard link`);\n',
    replacement: '',
    command: ['node', 'scripts/test-browser-smoke.js'],
  },
  {
    label: 'browser descriptor link-count guard',
    file: 'scripts/smoke-browser.js',
    original: ' || openedStat.nlink !== 1',
    replacement: '',
    command: ['node', 'scripts/test-browser-smoke.js'],
  },
  {
    label: 'shared contract hard-link behavior',
    file: 'scripts/test-proof-file-contract.js',
    original: "  const fileHardLink = path.join(sourceRoot, 'hard-linked.js');\n  fs.linkSync(externalFile, fileHardLink);\n  assert.strictEqual(isContainedRegularFile(sourceRoot, fileHardLink), false);\n",
    replacement: '',
    command: ['node', 'scripts/check-proof-source.js'],
  },
  {
    label: 'browser hard-link behavior',
    file: 'scripts/test-browser-smoke.js',
    original: "  const hardLinkedArtifact = path.join(artifactRoot, 'hard-linked.png');\n  fs.linkSync(artifact, hardLinkedArtifact);\n  assert.throws(() => readBoundedRegularFile(hardLinkedArtifact, { minimumBytes: 1, maximumBytes: 1024 }), /hard link/u);\n",
    replacement: '',
    command: ['node', 'scripts/check-proof-source.js'],
  },
  {
    label: 'policy plan registration',
    file: 'scripts/check-proof-source.js',
    original: "const hardLinkIntegrityPlanPath = path.join(plansRoot, '2026-06-26-proof-hard-link-integrity.md');",
    replacement: "const hardLinkIntegrityPlanPath = path.join(plansRoot, 'missing-hard-link-plan.md');",
    command: ['node', 'scripts/check-proof-source.js'],
  },
  {
    label: 'public hard-link guidance',
    file: 'README.md',
    original: 'rejects symlinks, hard links, and non-regular files',
    replacement: 'rejects symlinks and non-regular files',
    command: ['node', 'scripts/check-proof-source.js'],
  },
  {
    label: 'completed hard-link plan',
    file: 'docs/plans/2026-06-26-proof-hard-link-integrity.md',
    original: '## Status: Completed',
    replacement: '## Status: Planned',
    command: ['node', 'scripts/check-proof-source.js'],
  },
];

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'remix-proof-hard-link-mutations-'));
try {
  const checkout = path.join(tempRoot, 'repo');
  fs.cpSync(root, checkout, {
    recursive: true,
    filter: (entry) => !['.git', '.explore'].includes(path.basename(entry)),
  });
  childProcess.execFileSync('git', ['init', '-q'], { cwd: checkout });
  childProcess.execFileSync('git', ['add', '.'], { cwd: checkout });

  for (const mutation of mutations) {
    const filePath = path.join(checkout, mutation.file);
    const source = fs.readFileSync(filePath, 'utf8');
    assert.ok(source.includes(mutation.original), `mutation target missing: ${mutation.label}`);
    fs.writeFileSync(filePath, source.replace(mutation.original, mutation.replacement));
    const result = childProcess.spawnSync(mutation.command[0], mutation.command.slice(1), {
      cwd: checkout,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    fs.writeFileSync(filePath, source);
    assert.notStrictEqual(result.status, 0, `mutation survived: ${mutation.label}\n${result.stdout}${result.stderr}`);
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('hard-link mutations passed (8 mutations)');
