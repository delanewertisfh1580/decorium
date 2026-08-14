import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = new URL('../..', import.meta.url);
const readJson = relativePath => JSON.parse(readFileSync(new URL(relativePath, root), 'utf8'));

describe('authored functional layout rules', () => {
  it('declares a schema-valid dining seating relationship for level-001', () => {
    const level = readJson('data/levels/level-001.json');
    const schema = readJson('data/schemas/level.schema.json');
    const validate = new Ajv().compile(schema);

    expect(level.ergonomicsRules.functionalLayoutRules).toEqual([{
      schemaVersion: 1,
      id: 'dining-seating-required',
      kind: 'adjacency',
      anchorSelector: { affordance: 'dining-surface' },
      partnerSelector: { affordance: 'dining-seat' },
      minPartners: 2,
      distance: { min: 0.05, max: 0.35 },
      weight: 1.2,
      messageKey: 'functional-dining-seat-required'
    }]);
    expect(validate(level)).toBe(true);
  });
});
