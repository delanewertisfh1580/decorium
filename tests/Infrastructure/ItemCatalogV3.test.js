import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { STATIC_DATA_FILES } from '../../src/Infrastructure/DataLoaders/staticDataAssets.js';

const root = process.cwd();

describe('PROD-009a item catalog v3', () => {
  it('validates authored interaction profiles through a versioned v3 JSON schema', () => {
    const catalog = JSON.parse(readFileSync(join(root, 'data/items/catalog.v3.json'), 'utf8'));
    const schema = JSON.parse(readFileSync(join(root, 'data/items/item.v3.schema.json'), 'utf8'));
    const validate = new Ajv().compile(schema);

    expect(catalog.schemaVersion).toBe(3);
    expect(validate(catalog)).toBe(true);
    expect(catalog.items.every(item => item.interactionProfile?.schemaVersion === 1)).toBe(true);
  });

  it('registers only the current catalog and schema as production static assets', () => {
    expect(STATIC_DATA_FILES).toContain('data/items/catalog.v3.json');
    expect(STATIC_DATA_FILES).toContain('data/items/item.v3.schema.json');
    expect(STATIC_DATA_FILES).not.toContain('data/items/catalog.v2.json');
    expect(STATIC_DATA_FILES).not.toContain('data/items/item.v2.schema.json');
  });
});
