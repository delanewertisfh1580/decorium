import { describe, expect, it } from 'vitest';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import Item from '../../../src/Domain/Items/Item.js';
import ItemVariant from '../../../src/Domain/Items/ItemVariant.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import InteriorGenerationRecipe from '../../../src/Domain/Rooms/InteriorGenerationRecipe.js';
import RoomInteriorGenerator from '../../../src/Domain/Rooms/RoomInteriorGenerator.js';

function vector() {
  return new FeatureVector({ woodShare: .4, metalShare: .1, glassShare: 0, plasticShare: .1, textileShare: .4, lightColorShare: .5, darkColorShare: .5, warmPaletteShare: .5, saturationLevel: .4, formSimplicity: .7, roundnessShare: .2, rectilinearShare: .8, sizeNorm: .4, priceNorm: .3, lightingFunctionShare: 0, storageFunctionShare: 0 });
}

function item() {
  return new Item({
    id: 'sofa-001', name: 'Test sofa', type: 'sofa', dimensions: { x: 2, z: 1 }, price: 1, featureVector: vector(),
    baseVariantId: 'base',
    variants: [new ItemVariant({ id: 'base', label: 'Base', unlockId: 'base-interior', visual: { materialId: 'textile', color: '#123456' } })],
    interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: ['lounge-seat'], frontAxis: null, usableSides: [] }),
    spatialBehavior: new SpatialBehavior({ schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none' })
  });
}

describe('RoomInteriorGenerator', () => {
  it('materializes recipe placements as canonical, configured catalog instances', () => {
    const recipe = new InteriorGenerationRecipe({ id: 'living-base', label: 'Living base', placements: [{ slotId: 'sofa-zone', itemId: 'sofa-001', variantId: 'base', position: { x: 2, y: 0, z: 2 }, rotation: { y: 0 } }] });
    const result = new RoomInteriorGenerator().generate({ recipe, seed: 7, bounds: new RoomBounds(8, 6), itemsById: new Map([['sofa-001', item()]]), surfaceDefaults: { floorFinishId: 'floor-oak', wallFinishId: 'wall-linen' }, allowedItemIds: new Set(['sofa-001']), unlockedIds: new Set(['base-interior']) });
    expect(result.success).toBe(true);
    expect(result.data.recipeId).toBe('living-base');
    expect(result.data.seed).toBe(7);
    expect(result.data.roomState.getItems()).toMatchObject([{ id: 'sofa-001#1', itemId: 'sofa-001', configuration: { variantId: 'base' } }]);
    expect(result.data.roomState.surfaceConfiguration.toJSON()).toEqual({ floorFinishId: 'floor-oak', wallFinishId: 'wall-linen' });
  });

  it('rejects a recipe variant that has not been unlocked', () => {
    const recipe = new InteriorGenerationRecipe({ id: 'living-base', label: 'Living base', placements: [{ slotId: 'sofa-zone', itemId: 'sofa-001', variantId: 'base', position: { x: 2, y: 0, z: 2 }, rotation: { y: 0 } }] });
    const result = new RoomInteriorGenerator().generate({ recipe, seed: 0, bounds: new RoomBounds(8, 6), itemsById: new Map([['sofa-001', item()]]), surfaceDefaults: { floorFinishId: 'floor-oak', wallFinishId: 'wall-linen' }, unlockedIds: new Set() });
    expect(result).toEqual({ success: false, error: 'RECIPE_VARIANT_LOCKED: sofa-001/base' });
  });
});
