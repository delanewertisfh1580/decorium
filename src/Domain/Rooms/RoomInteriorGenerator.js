import { RoomState } from './RoomState.js';
import SurfaceConfiguration from './SurfaceConfiguration.js';
import ItemConfiguration from './ItemConfiguration.js';
import InteriorGenerationRecipe from './InteriorGenerationRecipe.js';
import { RoomBounds } from './RoomBounds.js';

export class RoomInteriorGenerator {
  generate({ recipe, seed, bounds, itemsById, surfaceDefaults, allowedItemIds = null, unlockedIds = null }) {
    if (!(recipe instanceof InteriorGenerationRecipe)) throw new Error('RoomInteriorGenerator requires an InteriorGenerationRecipe.');
    if (!Number.isInteger(seed) || seed < 0) throw new Error('RoomInteriorGenerator seed must be a non-negative integer.');
    if (!(bounds instanceof RoomBounds)) throw new Error('RoomInteriorGenerator bounds must be a RoomBounds.');
    if (!(itemsById instanceof Map)) throw new Error('RoomInteriorGenerator itemsById must be a Map.');
    if (!surfaceDefaults || typeof surfaceDefaults !== 'object') throw new Error('RoomInteriorGenerator surfaceDefaults are required.');
    if (allowedItemIds !== null && !(allowedItemIds instanceof Set)) throw new Error('RoomInteriorGenerator allowedItemIds must be a Set or null.');
    if (unlockedIds !== null && !(unlockedIds instanceof Set)) throw new Error('RoomInteriorGenerator unlockedIds must be a Set or null.');

    const roomState = RoomState.createEmpty(bounds, new SurfaceConfiguration(surfaceDefaults));
    for (const placement of recipe.placements) {
      if (allowedItemIds && !allowedItemIds.has(placement.itemId)) {
        return Object.freeze({ success: false, error: `RECIPE_ITEM_NOT_AVAILABLE: ${placement.itemId}` });
      }
      const item = itemsById.get(placement.itemId);
      if (!item) return Object.freeze({ success: false, error: `RECIPE_ITEM_UNKNOWN: ${placement.itemId}` });
      const variantId = placement.variantId ?? item.baseVariantId;
      const variant = variantId ? item.getVariant(variantId) : null;
      if (variant && unlockedIds && !variant.isUnlocked(unlockedIds)) {
        return Object.freeze({ success: false, error: `RECIPE_VARIANT_LOCKED: ${placement.itemId}/${variantId}` });
      }
      const configuration = variantId ? ItemConfiguration.default(variantId) : null;
      const result = roomState.placeItem(item, placement.position, placement.rotation.y, null, configuration);
      if (!result.success) return Object.freeze({ success: false, error: `RECIPE_PLACEMENT_INVALID: ${placement.slotId}/${result.error}` });
    }

    return Object.freeze({
      success: true,
      data: Object.freeze({ recipeId: recipe.id, seed, roomState })
    });
  }
}

export default RoomInteriorGenerator;
