import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const schemaPath = resolve(root, 'data/styles/style-constraint-catalog.v1.schema.json');
const catalogPath = resolve(root, 'data/styles/style-constraint-catalog.v1.json');
const briefsPath = resolve(root, 'data/briefs/client-briefs.v3.json');

describe('PROD-023 multi-style constraint content', () => {
  it('ships a schema-valid profile for every authored ClientBrief V3 style target', () => {
    expect(existsSync(schemaPath)).toBe(true);
    expect(existsSync(catalogPath)).toBe(true);
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    const briefs = JSON.parse(readFileSync(briefsPath, 'utf8'));
    const validate = new Ajv().compile(schema);

    expect(validate(catalog)).toBe(true);
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.profiles.map(profile => profile.id).sort()).toEqual(['eclectic', 'japandi', 'scandinavian']);
    const profilesById = new Map(catalog.profiles.map(profile => [profile.id, profile]));
    const targetIds = new Set(briefs.briefs.flatMap(brief => brief.styleTargets.map(target => target.styleId)));
    for (const styleId of targetIds) {
      const profile = profilesById.get(styleId);
      expect(profile, `Missing authored profile for ${styleId}`).toBeTruthy();
      expect(profile.constraints.length, `Empty authored profile for ${styleId}`).toBeGreaterThan(0);
      expect(profile.constraints.every(constraint => constraint.messageKey && constraint.id)).toBe(true);
    }
  });
});
