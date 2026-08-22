import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CatalogValidator } from '../../../src/Domain/Items/CatalogValidator.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import InteriorGenerationRecipe from '../../../src/Domain/Rooms/InteriorGenerationRecipe.js';
import RoomInteriorGenerator from '../../../src/Domain/Rooms/RoomInteriorGenerator.js';
import StyleInfluenceProfile from '../../../src/Domain/Scoring/StyleInfluenceProfile.js';

const root = new URL('../../..', import.meta.url);
const readJson = relativePath => JSON.parse(readFileSync(new URL(relativePath, root), 'utf8'));
const items = new CatalogValidator().createItems(readJson('data/items/catalog.v5.json').items);
const itemsById = new Map(items.map(item => [item.id, item]));
const recipesById = new Map(readJson('data/interior/interior-recipes.v1.json').recipes.map(recipe => [
  recipe.id,
  new InteriorGenerationRecipe(recipe)
]));
const styleInfluence = readJson('data/scoring/scoring-parameters.json').styleInfluence;
const unlockedIds = new Set(items.flatMap(item => item.variants.map(variant => variant.unlockId)));

const expectedShadowMatrix = Object.freeze({
  'level-001': Object.freeze({
    totalWeight: 6.004843013705,
    weightedWoodShare: 0.29068419966,
    legacyWoodShare: 0.3,
    contributionWeights: Object.freeze({
      'sofa-001#1': 2,
      'table-001#1': 1.272792206136,
      'lamp-001#1': 0.5,
      'rug-001#1': 1.732050807569,
      'mirror-001#1': 0.5
    })
  }),
  'level-002': Object.freeze({
    totalWeight: 5.166511917096,
    weightedWoodShare: 0.24228614747,
    legacyWoodShare: 0.28,
    contributionWeights: Object.freeze({
      'sofa-002#1': 1.3416407865,
      'tv-001#1': 0.692820323028,
      'coffeetable-001#1': 0.9,
      'lamp-002#1': 0.5,
      'rug-001#1': 1.732050807569
    })
  }),
  'level-003': Object.freeze({
    totalWeight: 6.358660327764,
    weightedWoodShare: 0.33405238818,
    legacyWoodShare: 0.43,
    contributionWeights: Object.freeze({
      'desk-001#1': 0.989949493661,
      'chair-002#1': 0.8,
      'sofa-001#1': 2,
      'cabinet-001#1': 0.836660026534,
      'rug-001#1': 1.732050807569
    })
  })
});

function materializeRoom(levelId) {
  const level = readJson(`data/levels/${levelId}.json`);
  const generated = new RoomInteriorGenerator().generate({
    recipe: recipesById.get(level.interiorRecipeId),
    seed: level.generationSeed,
    bounds: new RoomBounds(level.roomDimensions.width, level.roomDimensions.depth),
    itemsById,
    surfaceDefaults: level.surfaceDefaults,
    allowedItemIds: new Set(level.availableItems),
    unlockedIds
  });
  if (!generated.success) throw new Error(`${levelId}: ${generated.error}`);
  return generated.data.roomState.getItems();
}

describe('V3 style influence shadow baseline', () => {
  it('keeps the retired unweighted aggregation as a test-only reference and locks the approved weighted campaign matrix', () => {
    for (const [levelId, expected] of Object.entries(expectedShadowMatrix)) {
      const placedItems = materializeRoom(levelId);
      const legacyReference = FeatureVector.average(placedItems.map(item => item.featureVector));
      const activeV3 = StyleInfluenceProfile.fromPlacedItems({ placedItems, styleInfluence });

      expect(activeV3.totalWeight).toBeCloseTo(expected.totalWeight, 12);
      expect(activeV3.roomVector.woodShare).toBeCloseTo(expected.weightedWoodShare, 12);
      expect(legacyReference.woodShare).toBeCloseTo(expected.legacyWoodShare, 12);
      expect(activeV3.roomVector.woodShare).not.toBeCloseTo(legacyReference.woodShare, 6);
      const contributionWeights = new Map(activeV3.contributions.map(entry => [entry.instanceId, entry.influenceWeight]));
      for (const [instanceId, expectedWeight] of Object.entries(expected.contributionWeights)) {
        expect(contributionWeights.get(instanceId)).toBeCloseTo(expectedWeight, 12);
      }
    }
  });
});
