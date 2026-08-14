import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATIC_DATA_FILES } from '../../src/Infrastructure/DataLoaders/staticDataAssets.js';

const projectRoot = process.cwd();
const manifestPath = join(projectRoot, 'data/levels/manifest.json');

describe('PROD-002 authored level manifest', () => {
  it('declares a versioned ordered catalog of at least three authored levels', () => {
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.levels).toHaveLength(3);
    expect(manifest.levels.map(level => level.id)).toEqual(['level-001', 'level-002', 'level-003']);
    expect(manifest.levels.map(level => level.sortOrder)).toEqual([1, 2, 3]);
  });

  it('ships the manifest and every authored level in the static build manifest', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(STATIC_DATA_FILES).toContain('data/levels/manifest.json');

    for (const level of manifest.levels) {
      const path = `data/levels/${level.id}.json`;
      expect(existsSync(join(projectRoot, path))).toBe(true);
      expect(STATIC_DATA_FILES).toContain(path);
    }
  });
});
