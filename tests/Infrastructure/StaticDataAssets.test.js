import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATIC_DATA_FILES } from '../../src/Infrastructure/DataLoaders/staticDataAssets.js';

const root = process.cwd();
const readJson = file => JSON.parse(readFileSync(join(root, file), 'utf8'));

const expected = [
  'data/briefs/client-brief.v3.schema.json',
  'data/briefs/client-briefs.v3.json',
  'data/feedback/scandinavian-feedback.json',
  'data/items/catalog.v5.json',
  'data/items/item.v5.schema.json',
  'data/presentation/environment-profile.v3.schema.json',
  'data/presentation/environment-profiles.v3.json',
  'data/interior/interior-recipe.v1.schema.json',
  'data/interior/interior-recipes.v1.json',
  'data/interior/surface-finish.v1.schema.json',
  'data/interior/surface-finishes.v1.json',
  'data/progression/reward-catalog.v1.schema.json',
  'data/progression/rewards.v1.json',
  'data/levels/manifest.json',
  'data/levels/level-001.json',
  'data/levels/level-002.json',
  'data/levels/level-003.json',
  'data/schemas/level.v2.schema.json',
  'data/scoring/scoring-parameters.json',
  'data/styles/style-constraint-catalog.v1.schema.json',
  'data/styles/style-constraint-catalog.v1.json'
];

describe('static production data assets', () => {
  it('lists every JSON file requested by the runtime loaders', () => {
    expect(STATIC_DATA_FILES).toEqual(expected);
    expect(STATIC_DATA_FILES.every(file => existsSync(join(root, file)))).toBe(true);
  });

  it('keeps every runtime asset valid JSON', () => {
    for (const file of STATIC_DATA_FILES) expect(() => readJson(file), file).not.toThrow();
  });
});
