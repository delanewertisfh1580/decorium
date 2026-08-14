import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const sourceRevision = '9e49e788ecf335a8f87f38486c08ed5a8e7f6ce1';

describe('generate-release-manifest build step', () => {
  it('writes a deterministic versioned manifest from explicit release inputs', () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), 'decorium-release-'));
    const outputPath = join(outputDirectory, 'release-manifest.json');

    try {
      execFileSync('node', ['scripts/generate-release-manifest.mjs'], {
        cwd: root,
        env: {
          ...process.env,
          RELEASE_MANIFEST_OUTPUT: outputPath,
          RELEASE_VERSION: '1.2.3',
          SOURCE_REVISION: sourceRevision,
          RELEASE_CHANNEL: 'pwa',
          BUILT_AT: '2026-08-14T18:45:00.000Z'
        }
      });

      expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toEqual({
        schemaVersion: 1,
        application: 'decorium',
        releaseVersion: '1.2.3',
        sourceRevision,
        channel: 'pwa',
        builtAt: '2026-08-14T18:45:00.000Z'
      });
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it('runs manifest generation before vite in the production build command', () => {
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

    expect(packageJson.scripts.build).toContain('generate-release-manifest.mjs');
    expect(packageJson.scripts.build.indexOf('generate-release-manifest.mjs')).toBeLessThan(packageJson.scripts.build.indexOf('vite build'));
  });
});
