import LevelDTO from '../DTOs/LevelDTO.js';
import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../Domain/Rooms/RoomBounds.js';
import RoomInteriorGenerator from '../../Domain/Rooms/RoomInteriorGenerator.js';
import ClientBrief from '../../Domain/Briefs/ClientBrief.js';

function createEvaluationSpec(clientBrief, styleTargets) {
  const policy = clientBrief.evaluationPolicy;
  const ergonomics = policy.ergonomicsRules;
  return Object.freeze({
    schemaVersion: 1,
    styleTargets: Object.freeze(styleTargets),
    clientPriorities: Object.freeze([...clientBrief.clientPriorities]),
    spatialPreferences: clientBrief.spatialPreferences,
    compositionRules: policy.compositionRules,
    ergonomicsRules: Object.freeze({
      minimumClearance: ergonomics.minimumClearance,
      passageZones: ergonomics.passageZones,
      functionalLayoutRules: ergonomics.functionalLayoutRules,
      requiredFunctionalScenarios: ergonomics.requiredFunctionalScenarios
    }),
    completion: policy.completion
  });
}

function hasUnlocked(profile, unlockId) {
  return Boolean(profile && typeof profile.hasUnlock === 'function' && profile.hasUnlock(unlockId));
}
export class LoadLevelUseCase {
  constructor(levelRepository, itemCatalog, constraintCatalog, presentationEnvironmentRepository, clientBriefRepository, {
    interiorRecipeRepository = null,
    surfaceFinishCatalog = null,
    roomDesignRepository = null,
    getPlayerProfile = () => null,
    roomInteriorGenerator = new RoomInteriorGenerator()
  } = {}) {
    if (!levelRepository) throw new Error('LoadLevelUseCase: levelRepository is required.');
    if (!itemCatalog) throw new Error('LoadLevelUseCase: itemCatalog is required.');
    if (!constraintCatalog) throw new Error('LoadLevelUseCase: constraintCatalog is required.');
    if (!presentationEnvironmentRepository) throw new Error('LoadLevelUseCase: presentationEnvironmentRepository is required.');
    if (!clientBriefRepository) throw new Error('LoadLevelUseCase: clientBriefRepository is required.');
    if (typeof getPlayerProfile !== 'function') throw new Error('LoadLevelUseCase: getPlayerProfile must be a function.');
    this.levelRepository = levelRepository;
    this.itemCatalog = itemCatalog;
    this.constraintCatalog = constraintCatalog;
    this.presentationEnvironmentRepository = presentationEnvironmentRepository;
    this.clientBriefRepository = clientBriefRepository;
    this.interiorRecipeRepository = interiorRecipeRepository;
    this.surfaceFinishCatalog = surfaceFinishCatalog;
    this.roomDesignRepository = roomDesignRepository;
    this.getPlayerProfile = getPlayerProfile;
    this.roomInteriorGenerator = roomInteriorGenerator;
  }

  async execute(levelId) {
    if (!levelId || typeof levelId !== 'string' || levelId.trim() === '') return { success: false, error: 'INVALID_INPUT: Level ID must be a non-empty string.' };
    try {
      const raw = await this.levelRepository.loadLevel(levelId);
      if (!raw) return { success: false, error: `LEVEL_NOT_FOUND: Level with ID '${levelId}' not found.` };
      if (raw.schemaVersion !== 2 || !raw.id || !raw.roomId || !raw.roomDimensions || !Array.isArray(raw.availableItems)
        || !raw.clientBriefId || !raw.presentationProfileId || !raw.interiorRecipeId || !Number.isInteger(raw.generationSeed) || !raw.surfaceDefaults) {
        return { success: false, error: 'INVALID_LEVEL_DATA: Missing required V2 level references or topology.' };
      }
      if (!this.interiorRecipeRepository || !this.surfaceFinishCatalog) return { success: false, error: 'LEVEL_LOADING_UNAVAILABLE: V2 interior repositories are required.' };
      const profile = this.getPlayerProfile();
      if (!profile?.profileId || !Array.isArray(profile.unlockedIds)) return { success: false, error: 'PROFILE_REQUIRED: Load a player profile before loading a level.' };

      const rawBrief = await this.clientBriefRepository.getById(raw.clientBriefId);
      if (!rawBrief) return { success: false, error: `INVALID_LEVEL_DATA: Unknown client brief ${raw.clientBriefId}` };
      const clientBrief = new ClientBrief(rawBrief);
      if (clientBrief.schemaVersion !== 2 || clientBrief.levelId !== raw.id) return { success: false, error: `INVALID_LEVEL_DATA: Client brief ${clientBrief.id} does not belong to ${raw.id}` };

      const bounds = new RoomBounds(raw.roomDimensions.width, raw.roomDimensions.depth);
      const availableItems = await this.itemCatalog.getItemsByIds(raw.availableItems);
      if (availableItems.length !== raw.availableItems.length) {
        const missing = raw.availableItems.filter(id => !availableItems.some(item => item.id === id));
        return { success: false, error: `INVALID_LEVEL_DATA: Missing catalog items: ${missing.join(', ')}` };
      }
      const itemsById = new Map(availableItems.map(item => [item.id, item]));
      const interiorRecipe = await this.interiorRecipeRepository.getById(raw.interiorRecipeId);
      if (!interiorRecipe) return { success: false, error: `INVALID_LEVEL_DATA: Unknown interior recipe ${raw.interiorRecipeId}` };

      const surfaceFinishes = await this.surfaceFinishCatalog.listFinishes();
      const finishesById = new Map(surfaceFinishes.map(finish => [finish.id, finish]));
      for (const [surface, finishId] of Object.entries({ floor: raw.surfaceDefaults.floorFinishId, wall: raw.surfaceDefaults.wallFinishId })) {
        const finish = finishesById.get(finishId);
        if (!finish || finish.surface !== surface) return { success: false, error: `INVALID_LEVEL_DATA: Invalid default ${surface} finish ${finishId}` };
        if (!hasUnlocked(profile, finish.unlockId)) return { success: false, error: `DEFAULT_SURFACE_LOCKED: ${finishId}` };
      }

      const generated = this.roomInteriorGenerator.generate({
        recipe: interiorRecipe,
        seed: raw.generationSeed,
        bounds,
        itemsById,
        surfaceDefaults: raw.surfaceDefaults,
        allowedItemIds: new Set(raw.availableItems),
        unlockedIds: new Set(profile.unlockedIds)
      });
      if (!generated.success) return { success: false, error: `INVALID_LEVEL_DATA: ${generated.error}` };
      const baselineRoomState = generated.data.roomState;
      let roomState = baselineRoomState.clone();
      const snapshot = this.roomDesignRepository ? await this.roomDesignRepository.load(profile.profileId, raw.id) : null;
      if (snapshot) {
        try {
          roomState = RoomState.deserialize(snapshot, bounds, itemsById);
        } catch (error) {
          return { success: false, error: `INVALID_SAVED_DESIGN: ${error.message}` };
        }
      }

      const presentationEnvironment = await this.presentationEnvironmentRepository.getById(raw.presentationProfileId);
      if (!presentationEnvironment) return { success: false, error: `INVALID_LEVEL_DATA: Unknown presentation profile ${raw.presentationProfileId}` };
      const styleTargets = await Promise.all(clientBrief.styleTargets.map(async target => {
        const styleProfile = await this.constraintCatalog.getStyleProfileById(target.styleId);
        if (!styleProfile || !Array.isArray(styleProfile.constraints) || styleProfile.constraints.length === 0) throw new Error(`Unknown style constraint profile ${target.styleId}`);
        return Object.freeze({ styleId: target.styleId, label: styleProfile.label, role: target.role, weight: target.weight, constraints: Object.freeze([...styleProfile.constraints]) });
      }));

      return {
        success: true,
        data: new LevelDTO({
          levelId: raw.id,
          roomId: raw.roomId,
          name: raw.name ?? raw.id,
          roomState,
          baselineRoomState,
          availableItems,
          styleId: clientBrief.primaryStyleTarget.styleId,
          targetScore: clientBrief.evaluationPolicy.completion.minimumStars,
          presentationEnvironment,
          clientBrief,
          evaluationSpec: createEvaluationSpec(clientBrief, styleTargets),
          interiorRecipe,
          generationSeed: raw.generationSeed,
          surfaceFinishes,
          unlockedIds: profile.unlockedIds
        })
      };
    } catch (error) {
      console.error(`LoadLevelUseCase: Unexpected error loading level ${levelId}:`, error);
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default LoadLevelUseCase;
