import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATIC_DATA_FILES } from '../../src/Infrastructure/DataLoaders/staticDataAssets.js';

const root = process.cwd();

const readJson = file => JSON.parse(readFileSync(join(root, file), 'utf8'));

describe('static production data assets', () => {
  it('lists every JSON file requested by the runtime loaders', () => {
    const expected = [
      'data/constraints/scandinavian-constraints.json',
      'data/feedback/scandinavian-feedback.json',
      'data/items/catalog.v2.json',
      'data/items/item.v2.schema.json',
      'data/levels/manifest.json',
      'data/levels/level-001.json',
      'data/levels/level-002.json',
      'data/levels/level-003.json',
      'data/schemas/level.schema.json',
      'data/scoring/scoring-parameters.json',
      'data/styles/scandinavian.json'
    ];

    expect(STATIC_DATA_FILES).toEqual(expected);
    expect(STATIC_DATA_FILES.every(file => existsSync(join(root, file)))).toBe(true);
  });

  it('keeps every runtime asset valid JSON', () => {
    for (const file of STATIC_DATA_FILES) {
      expect(() => readJson(file), file).not.toThrow();
    }
  });
});
