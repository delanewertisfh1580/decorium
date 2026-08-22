import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = new URL('../..', import.meta.url);
const readJson = relativePath => JSON.parse(readFileSync(new URL(relativePath, root), 'utf8'));

describe('authored view-target lounge scenario', () => {
  it('adds an explicit TV view target and directional sofa/coffee rules to level-002', () => {
    const catalog = readJson('data/items/catalog.v5.json');
    const level = readJson('data/levels/level-002.json');
    const schema = readJson('data/schemas/level.v2.schema.json');
    const briefCatalog = readJson('data/briefs/client-briefs.v3.json');
    const recipeCatalog = readJson('data/interior/interior-recipes.v1.json');
    const brief = briefCatalog.briefs.find(candidate => candidate.id === level.clientBriefId);
    const recipe = recipeCatalog.recipes.find(candidate => candidate.id === level.interiorRecipeId);
    const tv = catalog.items.find(item => item.id === 'tv-001');

    expect(tv).toMatchObject({
      id: 'tv-001',
      type: 'media',
      dimensions: { x: 1.6, z: 0.3 },
      interactionProfile: {
        schemaVersion: 1,
        affordances: ['view-target'],
        frontAxis: 'negativeZ',
        usableSides: []
      }
    });
    expect(level.availableItems).toContain('tv-001');
    expect(recipe.placements).toEqual(expect.arrayContaining([expect.objectContaining({ itemId: 'tv-001', variantId: 'base' })]));
    expect(brief.evaluationPolicy.ergonomicsRules.functionalLayoutRules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'lounge-seat-faces-view-target',
        kind: 'front-adjacency',
        anchorSelector: { affordance: 'lounge-seat' },
        partnerSelector: { affordance: 'view-target' },
        minPartners: 1,
        distance: { min: 1, max: 4 },
        maxAngleDegrees: 30,
        messageKey: 'functional-lounge-faces-view-target'
      }),
      expect.objectContaining({
        id: 'coffee-surface-in-front-of-lounge-seat',
        kind: 'front-adjacency',
        anchorSelector: { affordance: 'lounge-seat' },
        partnerSelector: { affordance: 'coffee-surface' },
        minPartners: 1,
        distance: { min: 0.1, max: 0.6 },
        maxAngleDegrees: 30,
        messageKey: 'functional-coffee-surface-in-front-of-lounge-seat'
      })
    ]));
    expect(brief.levelId).toBe('level-002');
    expect(new Ajv().compile(schema)(level)).toBe(true);
  });
});
