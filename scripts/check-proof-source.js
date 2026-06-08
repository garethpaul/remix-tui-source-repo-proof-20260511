#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'poe-source');
const manifestPath = path.join(sourceRoot, 'PACKAGE_MANIFEST.json');
const failures = [];

function rel(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
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
    const manifestFiles = Array.isArray(manifest.files) ? manifest.files : [];
    if (manifestFiles.length === 0 || manifestFiles.some((file) => typeof file !== 'string' || file.trim() === '')) {
      failures.push('poe-source/PACKAGE_MANIFEST.json must contain a non-empty string files array');
    }

    manifestFiles.forEach((file) => {
      const filePath = path.join(sourceRoot, file);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        failures.push(`manifest lists missing file ${file}`);
      }
    });

    const actualFiles = walkFiles(sourceRoot)
      .map((filePath) => path.relative(sourceRoot, filePath).replaceAll(path.sep, '/'))
      .sort();
    const listedFiles = [...manifestFiles].sort();
    if (JSON.stringify(actualFiles) !== JSON.stringify(listedFiles)) {
      failures.push(`manifest files ${JSON.stringify(listedFiles)} do not match source files ${JSON.stringify(actualFiles)}`);
    }
  }
}

const htmlPath = path.join(sourceRoot, 'index.html');
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

  const linkedFiles = [];
  for (const match of html.matchAll(/<(script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
    const reference = match[2];
    if (/^https?:\/\//i.test(reference) || reference.startsWith('//')) {
      failures.push(`poe-source/index.html must not load remote asset ${reference}`);
      continue;
    }
    linkedFiles.push(reference);
    const normalized = reference.replace(/^\.\//, '');
    const filePath = path.join(sourceRoot, normalized);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      failures.push(`poe-source/index.html references missing asset ${reference}`);
    }
  }
  if (!linkedFiles.includes('./game.js')) {
    failures.push('poe-source/index.html must load ./game.js');
  }
}

const gamePath = path.join(sourceRoot, 'game.js');
if (!fs.existsSync(gamePath)) {
  failures.push('poe-source/game.js is missing');
} else {
  const sandbox = { globalThis: {} };
  try {
    vm.runInNewContext(readText(gamePath), sandbox, { filename: rel(gamePath) });
    const result = sandbox.globalThis.GameLogic && sandbox.globalThis.GameLogic.runDemo();
    if (!result || result.complete !== true || result.summary !== 'Repo crystal rally source complete') {
      failures.push('GameLogic.runDemo() must return the documented proof summary');
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
