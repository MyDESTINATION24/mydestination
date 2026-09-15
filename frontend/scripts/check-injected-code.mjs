#!/usr/bin/env node
/**
 * Fails when a tracked source file looks like it is hiding executable code.
 *
 * An obfuscated loader was appended to frontend/vite.config.js at least four
 * times (3765f89, 5b5c202, d0b7a58, f2beb08). Each time it sat on the last
 * line behind a long run of tabs, so the file opened looking normal and the
 * payload only showed if you scrolled right. It ran on every `vite build`.
 *
 * Run: node scripts/check-injected-code.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';

// A minified vendor file can legitimately have long lines; hand-written source
// and config in this repo does not.
const MAX_LINE_LENGTH = 2000;
const SCAN_EXTENSIONS = /\.(js|mjs|cjs|jsx|ts|tsx)$/;
const SKIP_PATH = /(^|\/)(node_modules|dist|build|coverage)\//;

// Hidden loaders reach for these to pull and run a remote payload.
const SUSPICIOUS_PATTERNS = [
  { re: /\beval\s*\(/, label: 'eval(' },
  { re: /\bnew\s+Function\s*\(/, label: 'new Function(' },
  { re: /createRequire\s*\(/, label: 'createRequire(' },
  { re: /child_process/, label: 'child_process' },
  { re: /_0x[0-9a-f]{4,}/i, label: 'obfuscated identifiers (_0x…)' },
];

// Config files should never contain any of the above.
const CONFIG_FILE = /(^|\/)(vite|rollup|webpack|next|svelte|astro|tailwind|postcss|babel|eslint|vitest|jest)\.config\.[cm]?[jt]s$/;

// Prefer git's file list, but fall back to walking the tree: this also runs as
// a prebuild step, where a missing git must not fail an otherwise good deploy.
const listTrackedFiles = () => {
  try {
    return execSync('git ls-files', {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = `${dir}/${entry.name}`;
      if (entry.name === '.git' || SKIP_PATH.test(`${full}/`)) return [];
      return entry.isDirectory() ? walk(full) : [full];
    });
    try {
      return walk('.');
    } catch {
      return [];
    }
  }
};

const findings = [];

for (const file of listTrackedFiles()) {
  if (!SCAN_EXTENSIONS.test(file) || SKIP_PATH.test(file)) continue;

  let contents;
  try {
    if (statSync(file).size > 8 * 1024 * 1024) continue;
    contents = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = contents.split('\n');
  lines.forEach((line, index) => {
    if (line.length > MAX_LINE_LENGTH) {
      findings.push(`${file}:${index + 1} — line is ${line.length} chars (limit ${MAX_LINE_LENGTH}); code may be hidden past trailing whitespace`);
    }
  });

  if (CONFIG_FILE.test(file)) {
    for (const { re, label } of SUSPICIOUS_PATTERNS) {
      if (re.test(contents)) {
        findings.push(`${file} — build config contains ${label}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error('\nPossible injected code found:\n');
  for (const finding of findings) console.error(`  ✗ ${finding}`);
  console.error('\nInspect these before building or deploying. If a file was tampered with,');
  console.error('restore it and treat every credential reachable from that machine as exposed.\n');
  process.exit(1);
}

console.log('✓ No injected-code patterns found in tracked source.');
