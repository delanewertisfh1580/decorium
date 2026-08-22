import LevelDTO from '../DTOs/LevelDTO.js';
import ClientBrief from '../../Domain/Briefs/ClientBrief.js';
import { RoomBounds } from '../../Domain/Rooms/RoomBounds.js';
import RoomInteriorGenerator from '../../Domain/Rooms/RoomInteriorGenerator.js';
import EndlessLevelGenerator from '../../Domain/Levels/EndlessLevelGenerator.js';

function evaluationSpecFor(clientBrief, styleTargets) {
  const policy = clientBrief.evaluationPolicy;
  const ergonomics = policy.ergonomicsRules;
  return Object.freeze({
    schemaVersion: 1,
    styleTargets: Object.freeze(styleTargets),
    clientPriorities: Object.freeze([...clientBrief.clientPriorities]),
    spatialPreferences: clientBrief.spatialPreferences,
    functionalSatisfactionPolicy: policy.functionalSatisfactionPolicy,
    evaluationPolicy: policy,
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

function endlessBriefFor({ seed, blueprint }) {
  return new ClientBrief({
    schemaVersion: 3,
    id: `endless-brief-${seed}`,
    levelId: `endless-${seed}`,
    client: blueprint.client,
    title: `${blueprint.name} · заказ #${seed}`,
    summary: blueprint.summary,
    styleTargets: blueprint.styleTargets,
    clientPriorities: [{
      id: `endless-priority-${seed}`,
      label: blueprint.clientPriority.label,
      weight: 1,
      rule: {
        schemaVersion: 1,
        kind: 'spatial-preferences',
        messageKey: blueprint.clientPriority.messageKey
      }
    }],
    spatialPreferences: blueprint.spatialPreferences,
    evaluationPolicy: blueprint.evaluationPolicy
  });
}

function validDefaultSurfaces(blueprint, finishes, profile) {
  const finishesById = new Map(finishes.map(finish => [finish.id, finish]));
  for (const [surface, finishId] of Object.entries({ floor: blueprint.surfaceDefaults.floorFinishId, wall: blueprint.surfaceDefaults.wallFinishId })) {
    const finish = finishesById.get(finishId);
    if (!finish || finish.surface !== surface || !profile.hasUnlock(finish.unlockId)) {
      return false;
    }
  }
  return true;
}

export class GenerateEndlessLevelUseCase {
  constructor({ endlessBlueprintCatalog, itemCatalog, constraintCatalog, presentationEnvironmentRepository, surfaceFinishCatalog, getPlayerProfile = () => null, endlessLevelGenerator = new EndlessLevelGenerator(), roomInteriorGenerator = new RoomInteriorGenerator() } = {}) {
    if (!endlessBlueprintCatalog || typeof endlessBlueprintCatalog.listBlueprints !== 'function') throw new Error('GenerateEndlessLevelUseCase: endlessBlueprintCatalog is required.');
    if (!itemCatalog || typeof itemCatalog.getAllItems !== 'function') throw new Error('GenerateEndlessLevelUseCase: itemCatalog is required.');
    if (!constraintCatalog || typeof constraintCatalog.getStyleProfileById !== 'function') throw new Error('GenerateEndlessLevelUseCase: constraintCatalog is required.');
    if (!presentationEnvironmentRepository || typeof presentationEnvironmentRepository.getById !== 'function') throw new Error('GenerateEndlessLevelUseCase: presentationEnvironmentRepository is required.');
    if (!surfaceFinishCatalog || typeof surfaceFinishCatalog.listFinishes !== 'function') throw new Error('GenerateEndlessLevelUseCase: surfaceFinishCatalog is required.');
    if (typeof getPlayerProfile !== 'function') throw new Error('GenerateEndlessLevelUseCase: getPlayerProfile must be a function.');
    this.endlessBlueprintCatalog = endlessBlueprintCatalog;
    this.itemCatalog = itemCatalog;
    this.constraintCatalog = constraintCatalog;
    this.presentationEnvironmentRepository = presentationEnvironmentRepository;
    this.surfaceFinishCatalog = surfaceFinishCatalog;
    this.getPlayerProfile = getPlayerProfile;
    this.endlessLevelGenerator = endlessLevelGenerator;
    this.roomInteriorGenerator = roomInteriorGenerator;
  }

  async execute({ seed } = {}) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
      return { success: false, error: 'INVALID_INPUT: Endless seed must be an unsigned 32-bit integer.' };
    }
    try {
      const profile = this.getPlayerProfile();
      if (!profile?.profileId || !Array.isArray(profile.unlockedIds)) {
        return { success: false, error: 'PROFILE_REQUIRED: Load a player profile before starting endless mode.' };
      }
      const [blueprints, catalogItems, surfaceFinishes] = await Promise.all([
        this.endlessBlueprintCatalog.listBlueprints(),
        this.itemCatalog.getAllItems(),
        this.surfaceFinishCatalog.listFinishes()
      ]);
      const generated = this.endlessLevelGenerator.generate({
        seed,
        blueprints,
        catalogItems,
        unlockedIds: new Set(profile.unlockedIds)
      });
      if (!generated.success) return generated;
      const { blueprint, room, availableItems, interiorRecipe } = generated.data;
      if (!validDefaultSurfaces(blueprint, surfaceFinishes, profile)) {
        return { success: false, error: `DEFAULT_SURFACE_LOCKED: ${blueprint.id}` };
      }
      const itemsById = new Map(availableItems.map(item => [item.id, item]));
      const materialized = this.roomInteriorGenerator.generate({
        recipe: interiorRecipe,
        seed,
        bounds: new RoomBounds(room.width, room.depth),
        itemsById,
        surfaceDefaults: blueprint.surfaceDefaults,
        allowedItemIds: new Set(availableItems.map(item => item.id)),
        unlockedIds: new Set(profile.unlockedIds)
      });
      if (!materialized.success) return { success: false, error: `ENDLESS_MATERIALIZATION_FAILED: ${materialized.error}` };

      const presentationEnvironment = await this.presentationEnvironmentRepository.getById(blueprint.presentationProfileId);
      if (!presentationEnvironment) return { success: false, error: `ENDLESS_PRESENTATION_MISSING: ${blueprint.presentationProfileId}` };
      const clientBrief = endlessBriefFor({ seed, blueprint });
      const styleTargets = await Promise.all(clientBrief.styleTargets.map(async target => {
        const styleProfile = await this.constraintCatalog.getStyleProfileById(target.styleId);
        if (!styleProfile?.constraints?.length) throw new Error(`ENDLESS_STYLE_MISSING: ${target.styleId}`);
        return Object.freeze({ styleId: target.styleId, label: styleProfile.label, role: target.role, weight: target.weight, constraints: Object.freeze([...styleProfile.constraints]) });
      }));
      const roomState = materialized.data.roomState;
      return {
        success: true,
        data: new LevelDTO({
          levelId: `endless-${seed}`,
          roomId: `endless-room-${seed}`,
          name: clientBrief.title,
          roomState,
          baselineRoomState: roomState.clone(),
          availableItems,
          styleId: clientBrief.primaryStyleTarget.styleId,
          targetScore: clientBrief.evaluationPolicy.completion.minimumStars,
          presentationEnvironment,
          clientBrief,
          evaluationSpec: evaluationSpecFor(clientBrief, styleTargets),
          interiorRecipe,
          generationSeed: seed,
          surfaceFinishes,
          unlockedIds: profile.unlockedIds,
          mode: 'endless',
          run: { seed, blueprintId: blueprint.id }
        })
      };
    } catch (error) {
      console.error('GenerateEndlessLevelUseCase: Failed to generate endless level:', error);
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default GenerateEndlessLevelUseCase;
