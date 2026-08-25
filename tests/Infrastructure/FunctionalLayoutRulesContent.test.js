import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = new URL('../..', import.meta.url);
const readJson = relativePath => JSON.parse(readFileSync(new URL(relativePath, root), 'utf8'));

describe('authored functional layout rules', () => {
  it('declares a schema-valid dining seating relationship in level-001 client policy', () => {
    const level = readJson('data/levels/level-001.json');
    const levelSchema = readJson('data/schemas/level.v2.schema.json');
    const briefSchema = readJson('data/briefs/client-brief.v3.schema.json');
    const catalog = readJson('data/briefs/client-briefs.v3.json');
    const brief = catalog.briefs.find(candidate => candidate.id === level.clientBriefId);
    const validateLevel = new Ajv().compile(levelSchema);
    const validateBrief = new Ajv().compile(briefSchema);

    expect(brief.evaluationPolicy.ergonomicsRules.functionalLayoutRules).toEqual([{
      schemaVersion: 1,
      id: 'dining-seating-required',
      kind: 'adjacency',
      anchorSelector: { affordance: 'dining-surface' },
      partnerSelector: { affordance: 'dining-seat' },
      minPartners: 2,
      distance: { min: 0, max: 0.45 },
      weight: 1.2,
      messageKey: 'functional-dining-seat-required'
    }]);
    expect(validateLevel(level)).toBe(true);
    expect(validateBrief(catalog)).toBe(true);
    expect(brief.levelId).toBe(level.id);
  });
});
