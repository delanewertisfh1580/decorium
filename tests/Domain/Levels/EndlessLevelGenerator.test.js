import { describe, expect, it } from 'vitest';
import EndlessLevelGenerator from '../../../src/Domain/Levels/EndlessLevelGenerator.js';

function item(id, affordances) {
  return {
    id,
    baseVariantId: null,
    interactionProfile: { affordances },
    resolveConfiguration: () => ({ dimensions: { x: 1, z: 1 } })
  };
}

const blueprint = Object.freeze({
  id: 'test-endless',
  availableItemIds: ['seat', 'surface', 'lamp', 'plant'],
  room: { minWidth: 6, maxWidth: 8, minDepth: 5, maxDepth: 7 },
  evaluationPolicy: { compositionRules: { requiredAffordances: ['seat', 'surface', 'light'] } }
});

const catalogItems = [
  item('seat', ['seat']),
  item('surface', ['surface']),
  item('lamp', ['light']),
  item('plant', ['decor'])
];

describe('EndlessLevelGenerator', () => {
  it('creates identical solvable metadata and player-owned baseline recipe for the same seed', () => {
    const generator = new EndlessLevelGenerator();

    const first = generator.generate({ seed: 991, blueprints: [blueprint], catalogItems, unlockedIds: new Set() });
    const second = generator.generate({ seed: 991, blueprints: [blueprint], catalogItems, unlockedIds: new Set() });

    expect(first).toMatchObject({ success: true, data: { seed: 991, blueprint, room: { height: 3 } } });
    expect(second.data.room).toEqual(first.data.room);
    expect(second.data.interiorRecipe.placements).toEqual(first.data.interiorRecipe.placements);
    expect(first.data.availableItems.map(candidate => candidate.id)).toEqual(['seat', 'surface', 'lamp', 'plant']);
    expect(first.data.interiorRecipe.placements[0]).toMatchObject({ slotId: 'starter-piece' });
  });

  it('rejects a blueprint whose unlocked catalog pool cannot satisfy every required affordance', () => {
    const generator = new EndlessLevelGenerator();
    const result = generator.generate({
      seed: 1,
      blueprints: [blueprint],
      catalogItems: [item('seat', ['seat']), item('surface', ['surface'])],
      unlockedIds: new Set()
    });

    expect(result).toEqual({ success: false, error: 'UNSOLVABLE_BLUEPRINT: test-endless/light' });
  });
});
