import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = relativePath => readFile(path.join(root, relativePath), 'utf8').then(JSON.parse);

describe('Required functional scenario content', () => {
  it('ships one schema-valid, client-owned and inventory-satisfiable scenario for every level', async () => {
    const [schema, briefCatalog, itemCatalog, manifest] = await Promise.all([
      readJson('data/briefs/client-brief.v2.schema.json'),
      readJson('data/briefs/client-briefs.v2.json'),
      readJson('data/items/catalog.v4.json'),
      readJson('data/levels/manifest.json')
    ]);
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(briefCatalog), validate.errors?.map(error => error.message).join('; ')).toBe(true);

    const itemById = new Map(itemCatalog.items.map(item => [item.id, item]));
    const expectedScenarioByLevel = new Map([
      ['level-001', 'dining-hosting'],
      ['level-002', 'evening-media'],
      ['level-003', 'focused-work']
    ]);

    for (const levelManifest of manifest.levels) {
      const [level, brief] = await Promise.all([
        readJson(`data/levels/${levelManifest.id}.json`),
        Promise.resolve(briefCatalog.briefs.find(candidate => candidate.levelId === levelManifest.id))
      ]);
      expect(brief?.evaluationPolicy.ergonomicsRules.requiredFunctionalScenarios).toHaveLength(1);
      const [scenario] = brief.evaluationPolicy.ergonomicsRules.requiredFunctionalScenarios;
      expect(scenario.id).toBe(expectedScenarioByLevel.get(level.id));
      expect(scenario.critical).toBe(true);

      const inventory = level.availableItems.map(itemId => itemById.get(itemId));
      for (const role of scenario.requiredRoles) {
        const semanticSources = inventory.filter(item => item.interactionProfile.affordances.includes(role.affordance));
        expect(semanticSources.length, `${level.id} must provide a repeat-placeable ${role.affordance} source`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
