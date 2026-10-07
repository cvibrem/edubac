#!/usr/bin/env node
/**
 * Version bump for the tab-shell family.
 *
 * Single source of truth: package.json `version`. This script fans it out to
 * every place Android reads: build.gradle `versionName`, plus `versionCode`
 * (+1 per release — Google Play requires a monotonically increasing integer).
 *
 *   node scripts/bump-version.mjs patch        # 0.0.1 -> 0.0.2, code +1
 *   node scripts/bump-version.mjs minor        # 0.0.1 -> 0.1.0, code +1
 *   node scripts/bump-version.mjs major        # 0.0.1 -> 1.0.0, code +1
 *   node scripts/bump-version.mjs 1.2.3        # explicit version, code +1
 *   node scripts/bump-version.mjs patch --code 42   # explicit versionCode
 *   node scripts/bump-version.mjs patch --dry-run   # print, change nothing
 *
 * Afterwards: `git commit -am "release: vX.Y.Z" && git tag vX.Y.Z`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = resolve(root, 'package.json');
const gradlePath = resolve(root, 'android/app/build.gradle');

function fail(msg) {
	console.error(`bump-version: ${msg}`);
	process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const codeIdx = args.indexOf('--code');
let explicitCode = null;
if (codeIdx !== -1) {
	explicitCode = Number(args[codeIdx + 1]);
	if (!Number.isInteger(explicitCode) || explicitCode < 1) fail('--code needs a positive integer');
}
const positional = args.filter((a) => !a.startsWith('--') && a !== String(explicitCode));
if (positional.length !== 1) {
	fail('usage: bump-version.mjs <patch|minor|major|X.Y.Z> [--code N] [--dry-run]');
}
const bump = positional[0];

const pkgText = readFileSync(pkgPath, 'utf8');
const versionMatch = pkgText.match(/"version"\s*:\s*"([^"]+)"/);
if (!versionMatch) fail('no "version" field in package.json');
const current = versionMatch[1];

function nextVersion(cur, how) {
	const m = cur.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
	if (!m) fail(`current version "${cur}" is not semver`);
	let [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const suffix = m[4] ?? '';
	if (how === 'major') return `${major + 1}.0.0`;
	if (how === 'minor') return `${major}.${minor + 1}.0`;
	if (how === 'patch') return `${major}.${minor}.${patch + 1}${suffix}`;
	if (/^\d+\.\d+\.\d+/.test(how)) return how;
	fail(`unknown bump "${how}" — want patch|minor|major|X.Y.Z`);
	return cur;
}

const next = nextVersion(current, bump);

let gradleText;
try {
	gradleText = readFileSync(gradlePath, 'utf8');
} catch {
	fail('android/app/build.gradle not found — run from the repo root layout');
}
const codeMatch = gradleText.match(/versionCode\s+(\d+)/);
const nameMatch = gradleText.match(/versionName\s+"([^"]+)"/);
if (!codeMatch || !nameMatch) fail('versionCode/versionName not found in build.gradle');
const nextCode = explicitCode ?? Number(codeMatch[1]) + 1;

console.log(`versionName: ${current} -> ${next}`);
console.log(`versionCode: ${codeMatch[1]} -> ${nextCode}${explicitCode ? ' (explicit)' : ''}`);

if (dryRun) {
	console.log('(dry run — nothing written)');
	process.exit(0);
}

writeFileSync(pkgPath, pkgText.replace(/"version"\s*:\s*"[^"]+"/, `"version": "${next}"`));
writeFileSync(
	gradlePath,
	gradleText
		.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
		.replace(/versionName\s+"[^"]+"/, `versionName "${next}"`)
);
console.log('written. Next: git commit -am "release: v' + next + `" && git tag v${next}`);
