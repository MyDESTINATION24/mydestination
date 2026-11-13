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
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

// A minified vendor file can legitimately have long lines; hand-written source
// and config in this repo does not.
const MAX_LINE_LENGTH = 2000;
// Every tracked text file is checked for long lines, whatever its extension:
// db14add hid its payload in files named plain `init`, which an extension list
// let straight through. Binaries are detected by content (a NUL byte).
const SKIP_PATH = /(^|\/)(node_modules|dist|build|coverage)\//;
const SKIP_LONG_LINES = /(\.min\.(js|css)|package-lock\.json|\.svg|\.map)$/i;

// npm runs these on install, before any check of ours can.
const LIFECYCLE_HOOKS = ['preinstall', 'install', 'postinstall', 'prepare', 'prepublish', 'prepack', 'postpack'];
// The only files package scripts may hand to `node`. db14add rewired start,
// dev and build to run `node init` first; 6d68826 did the same with api.js.
const ALLOWED_NODE_TARGETS = /^(server\.js|seed[A-Za-z]*\.js|scripts\/check-injected-code\.mjs)$/;

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

const checkPackageScripts = (file, contents) => {
  let scripts;
  try { scripts = JSON.parse(contents).scripts || {}; } catch { return; }
  for (const [name, command] of Object.entries(scripts)) {
    if (LIFECYCLE_HOOKS.includes(name)) {
      findings.push(`${file} — "${name}" script runs on npm install: ${command}`);
    }
    for (const match of String(command).matchAll(/\bnode(?:mon)?\s+(?:-\S+\s+)*([^\s&|;]+)/g)) {
      if (!ALLOWED_NODE_TARGETS.test(match[1])) {
        findings.push(`${file} — "${name}" script runs an unexpected file: node ${match[1]}`);
      }
    }
  }
};

// db14add also deleted the .env rules, so a routine `git add` would publish
// every server secret.
const checkGitignore = (file, contents) => {
  const lines = contents.split(/\r?\n/).map((line) => line.trim());
  if (!lines.includes('.env') || !lines.some((line) => line === '**/.env' || line === '**/.env.*')) {
    findings.push(`${file} — the .env ignore rules are missing; secrets could be committed`);
  }
};

for (const file of listTrackedFiles()) {
  if (SKIP_PATH.test(file)) continue;

  let contents;
  try {
    if (statSync(file).size > 8 * 1024 * 1024) continue;
    const raw = readFileSync(file);
    if (raw.includes(0)) continue; // binary: images, audio, fonts
    contents = raw.toString('utf8');
  } catch {
    continue;
  }

  if (/(^|\/)package\.json$/.test(file)) checkPackageScripts(file, contents);
  // Only the repository root's .gitignore; frontend/.gitignore is Vite's own.
  if (file === '.gitignore' && existsSync('backend') && existsSync('frontend')) checkGitignore(file, contents);

  if (SKIP_LONG_LINES.test(file)) continue;
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

// The push that restored the payload in 75d3619 also deleted the CI workflow
// that would have caught it, so its absence is treated as a finding. Only
// checked when git can answer: outside a checkout we cannot tell "deleted"
// from "not part of this build context", and guessing would fail honest builds.
const WORKFLOW_PATH = '.github/workflows/security-scan.yml';
try {
  const tracked = execSync(`git ls-files --error-unmatch ${WORKFLOW_PATH}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    cwd: execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim(),
  }).trim();
  if (!tracked) throw new Error('missing');
} catch (error) {
  if (!/not a git repository|rev-parse/i.test(String(error?.message || ''))) {
    findings.push(`${WORKFLOW_PATH} — the security workflow is missing; it was deleted once already to get a payload past CI`);
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
