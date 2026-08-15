import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const schemaPath = resolve(root, 'data/briefs/client-brief.v1.schema.json');
const catalogPath = resolve(root, 'data/briefs/client-briefs.v1.json');
const levels = ['level-001', 'level-002', 'level-003'].map(levelId => (
  JSON.parse(readFileSync(resolve(root, `data/levels/${levelId}.json`), 'utf8'))
));

describe('PROD-018 ClientBrief v1 content', () => {
  it('ships a schema-valid brief owned by each playable level, with no level-side style or evaluation fallback', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    const validate = new Ajv().compile(schema);

    expect(validate(catalog)).toBe(true);
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.briefs).toHaveLength(3);

    const briefsById = new Map(catalog.briefs.map(brief => [brief.id, brief]));
    for (const level of levels) {
      expect(level.clientBriefId).toMatch(/^brief-/);
      expect(level).not.toHaveProperty('styleId');
      expect(level).not.toHaveProperty('targetScore');
      expect(level).not.toHaveProperty('compositionRules');
      expect(level).not.toHaveProperty('ergonomicsRules');
      const brief = briefsById.get(level.clientBriefId);
      expect(brief?.levelId).toBe(level.id);
      expect(brief?.styleTargets.find(target => target.role === 'primary')).toBeTruthy();
      expect(brief?.clientPriorities.length).toBeGreaterThan(0);
      expect(brief?.spatialPreferences.clearanceMultiplier).toBeGreaterThan(0);
    }
  });

  it('allows complex authored briefs to declare controlled style mixing and client-specific spatial preference as deterministic data', () => {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    const loungeBrief = catalog.briefs.find(brief => brief.levelId === 'level-002');

    expect(loungeBrief.styleTargets).toEqual(expect.arrayContaining([
      expect.objectContaining({ styleId: 'scandinavian', role: 'primary' }),
      expect.objectContaining({ role: 'secondary' }),
      expect.objectContaining({ role: 'accent' })
    ]));
    expect(loungeBrief.spatialPreferences).toMatchObject({
      density: 'intimate',
      clearanceMultiplier: expect.any(Number),
      emptySpacePreference: expect.objectContaining({ mode: 'discourage-excess' })
    });
  });
});
