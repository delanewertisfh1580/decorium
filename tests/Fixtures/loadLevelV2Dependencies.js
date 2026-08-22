import InteriorGenerationRecipe from '../../src/Domain/Rooms/InteriorGenerationRecipe.js';

export const defaultSurfaceFinishes = Object.freeze([
  Object.freeze({ id: 'floor-light-oak', surface: 'floor', unlockId: 'floor-light-oak', visual: { color: '#bca18b', roughness: 0.9, metalness: 0 } }),
  Object.freeze({ id: 'wall-warm-plaster', surface: 'wall', unlockId: 'wall-warm-plaster', visual: { color: '#4a5965', roughness: 0.96, metalness: 0 } })
]);

export const defaultProfile = Object.freeze({
  profileId: 'profile-test',
  unlockedIds: Object.freeze(['base-interior', 'floor-light-oak', 'wall-warm-plaster']),
  hasUnlock(unlockId) { return this.unlockedIds.includes(unlockId); }
});

export function asV2Level(level) {
  return {
    ...level,
    schemaVersion: 2,
    interiorRecipeId: level.interiorRecipeId ?? 'test-room-recipe',
    generationSeed: level.generationSeed ?? 0,
    surfaceDefaults: level.surfaceDefaults ?? { floorFinishId: 'floor-light-oak', wallFinishId: 'wall-warm-plaster' }
  };
}

export function loadLevelV2Dependencies({ profile = defaultProfile, recipe = new InteriorGenerationRecipe({ id: 'test-room-recipe', label: 'Test baseline', placements: [] }), finishes = defaultSurfaceFinishes } = {}) {
  return {
    interiorRecipeRepository: { getById: async id => id === recipe.id ? recipe : null },
    surfaceFinishCatalog: { listFinishes: async () => finishes, getById: async id => finishes.find(finish => finish.id === id) ?? null },
    getPlayerProfile: () => profile
  };
}
