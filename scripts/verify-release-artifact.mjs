import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import BuildInfo from '../src/Domain/Release/BuildInfo.js';

const artifactPath = resolve(process.cwd(), process.argv[2] ?? 'dist/release-manifest.json');
const buildInfo = BuildInfo.fromData(JSON.parse(readFileSync(artifactPath, 'utf8')));
console.log(`Validated release manifest: v${buildInfo.releaseVersion} ${buildInfo.channel} ${buildInfo.sourceRevision.slice(0, 7)}`);
