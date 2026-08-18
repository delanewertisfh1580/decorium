import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { STATIC_DATA_FILES } from '../../src/Infrastructure/DataLoaders/staticDataAssets.js';

const root = process.cwd();

describe('PROD-024 item catalog semantic coverage', () => {
  it('validates every shipped item against the V4 contract with explicit spatial behavior', () => {
    const catalog = JSON.parse(readFileSync(join(root, 'data/items/catalog.v4.json'), 'utf8'));
    const schema = JSON.parse(readFileSync(join(root, 'data/items/item.v4.schema.json'), 'utf8'));
    const validate = new Ajv().compile(schema);

    expect(catalog.schemaVersion).toBe(4);
    expect(validate(catalog), validate.errors?.map(error => `${error.instancePath} ${error.message}`).join('; ')).toBe(true);
    expect(catalog.items).toHaveLength(34);
    expect(catalog.items.every(item => item.interactionProfile?.schemaVersion === 1)).toBe(true);
    expect(catalog.items.every(item => item.spatialBehavior?.schemaVersion === 1)).toBe(true);
    expect(new Set(catalog.items.map(item => item.spatialBehavior.placementKind))).toEqual(new Set([
      'floor', 'floor-overlay', 'wall', 'ceiling', 'surface-mounted'
    ]));
  });

  it('registers only the active V4 catalog/schema as production static assets', () => {
    expect(STATIC_DATA_FILES).toContain('data/items/catalog.v4.json');
    expect(STATIC_DATA_FILES).toContain('data/items/item.v4.schema.json');
    expect(STATIC_DATA_FILES).not.toContain('data/items/catalog.v3.json');
    expect(STATIC_DATA_FILES).not.toContain('data/items/item.v3.schema.json');
  });
});
