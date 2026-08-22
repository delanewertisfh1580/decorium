import InteriorGenerationRecipe from '../Rooms/InteriorGenerationRecipe.js';

function requireSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error('EndlessLevelGenerator seed must be an unsigned 32-bit integer.');
  }
  return seed;
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function integerBetween(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function hasUnlockedBaseVariant(item, unlockedIds) {
  if (!item?.baseVariantId) return true;
  const variant = item.getVariant(item.baseVariantId);
  return Boolean(variant?.isUnlocked(unlockedIds));
}

function supportsAffordance(item, affordance) {
  return item.interactionProfile?.affordances?.includes(affordance) ?? false;
}

function recipeFor({ seed, room, items, random }) {
  if (items.length === 0) return new InteriorGenerationRecipe({
    id: `endless-${seed}-baseline`,
    label: 'Пустая стартовая планировка',
    placements: []
  });
  const starter = pick(random, items);
  const dimensions = starter.resolveConfiguration().dimensions;
  return new InteriorGenerationRecipe({
    id: `endless-${seed}-baseline`,
    label: 'Стартовая планировка бесконечного заказа',
    placements: [{
      slotId: 'starter-piece',
      itemId: starter.id,
      variantId: starter.baseVariantId,
      position: { x: Math.max(dimensions.x / 2, room.width / 2), y: 0, z: Math.max(dimensions.z / 2, room.depth / 2) },
      rotation: { y: 0 }
    }]
  });
}

/**
 * Pure generator for a replayable endless brief. Content blueprints define goals;
 * this service derives a concrete seed, dimensions, item availability and baseline.
 */
export class EndlessLevelGenerator {
  generate({ seed, blueprints, catalogItems, unlockedIds }) {
    const normalizedSeed = requireSeed(seed);
    if (!Array.isArray(blueprints) || blueprints.length === 0) {
      throw new Error('EndlessLevelGenerator requires at least one blueprint.');
    }
    if (!Array.isArray(catalogItems) || catalogItems.length === 0) {
      throw new Error('EndlessLevelGenerator requires catalog items.');
    }
    if (!(unlockedIds instanceof Set)) throw new Error('EndlessLevelGenerator unlockedIds must be a Set.');

    const random = createRandom(normalizedSeed);
    const blueprint = pick(random, blueprints);
    const permitted = new Set(blueprint.availableItemIds);
    const availableItems = catalogItems.filter(item => permitted.has(item.id) && hasUnlockedBaseVariant(item, unlockedIds));
    if (availableItems.length === 0) {
      return Object.freeze({ success: false, error: `NO_UNLOCKED_ITEMS: ${blueprint.id}` });
    }

    const requiredAffordances = blueprint.evaluationPolicy?.compositionRules?.requiredAffordances ?? [];
    const missingAffordances = requiredAffordances.filter(affordance => !availableItems.some(item => supportsAffordance(item, affordance)));
    if (missingAffordances.length > 0) {
      return Object.freeze({ success: false, error: `UNSOLVABLE_BLUEPRINT: ${blueprint.id}/${missingAffordances.join(',')}` });
    }

    const room = Object.freeze({
      width: integerBetween(random, blueprint.room.minWidth, blueprint.room.maxWidth),
      depth: integerBetween(random, blueprint.room.minDepth, blueprint.room.maxDepth),
      height: 3
    });
    const interiorRecipe = recipeFor({ seed: normalizedSeed, room, items: availableItems, random });
    return Object.freeze({
      success: true,
      data: Object.freeze({
        seed: normalizedSeed,
        blueprint,
        room,
        availableItems: Object.freeze(availableItems),
        interiorRecipe
      })
    });
  }
}

export default EndlessLevelGenerator;
