import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const revisionPattern = /^[0-9a-f]{40}$/;
const channelPattern = /^(web|pwa)$/;

function environmentValue(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${name} must be a non-empty string.`);
  return value.trim();
}

function gitRevision() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
}

const sourceRevision = environmentValue('SOURCE_REVISION', gitRevision());
const releaseVersion = environmentValue('RELEASE_VERSION', packageJson.version);
const channel = environmentValue('RELEASE_CHANNEL', 'web');
const builtAt = environmentValue('BUILT_AT', new Date().toISOString());
if (!revisionPattern.test(sourceRevision)) throw new Error('SOURCE_REVISION must be a 40-character lowercase Git SHA.');
if (!channelPattern.test(channel)) throw new Error('RELEASE_CHANNEL must be web or pwa.');
if (Number.isNaN(Date.parse(builtAt))) throw new Error('BUILT_AT must be an ISO timestamp.');

const outputPath = resolve(root, process.env.RELEASE_MANIFEST_OUTPUT ?? 'public/release-manifest.json');
const manifest = {
  schemaVersion: 1,
  application: 'decorium',
  releaseVersion,
  sourceRevision,
  channel,
  builtAt
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated release manifest: ${outputPath}`);
