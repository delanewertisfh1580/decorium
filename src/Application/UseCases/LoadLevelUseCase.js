import LevelDTO from '../DTOs/LevelDTO.js';
import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../Domain/Rooms/RoomBounds.js';
import MinimumClearanceRule from '../../Domain/Ergonomics/MinimumClearanceRule.js';
import PassageZone from '../../Domain/Ergonomics/PassageZone.js';
import FunctionalLayoutRule from '../../Domain/Ergonomics/FunctionalLayoutRule.js';
import RequiredFunctionalScenario from '../../Domain/Ergonomics/RequiredFunctionalScenario.js';
import ClientBrief from '../../Domain/Briefs/ClientBrief.js';

function createErgonomicsRules(data = {}, clientMultiplier = 1) {
  const rules = {};
  if (data.minimumClearance) {
    rules.minimumClearance = new MinimumClearanceRule({
      ...data.minimumClearance,
      clientMultiplier
    });
  }
  if (Array.isArray(data.passageZones)) {
    rules.passageZones = Object.freeze(data.passageZones.map(zone => new PassageZone(zone)));
  }
  if (Array.isArray(data.functionalLayoutRules)) {
    rules.functionalLayoutRules = Object.freeze(
      data.functionalLayoutRules.map(rule => new FunctionalLayoutRule(rule))
    );
  }
  if (Array.isArray(data.requiredFunctionalScenarios)) {
    rules.requiredFunctionalScenarios = Object.freeze(
      data.requiredFunctionalScenarios.map(scenario => new RequiredFunctionalScenario(scenario))
    );
  }
  return Object.freeze(rules);
}

export class LoadLevelUseCase {
  constructor(levelRepository, itemCatalog, constraintCatalog, presentationEnvironmentRepository, clientBriefRepository) {
    if (!levelRepository) throw new Error('LoadLevelUseCase: levelRepository is required.');
    if (!itemCatalog) throw new Error('LoadLevelUseCase: itemCatalog is required.');
    if (!constraintCatalog) throw new Error('LoadLevelUseCase: constraintCatalog is required.');
    if (!presentationEnvironmentRepository) throw new Error('LoadLevelUseCase: presentationEnvironmentRepository is required.');
    if (!clientBriefRepository) throw new Error('LoadLevelUseCase: clientBriefRepository is required.');
    this.levelRepository = levelRepository;
    this.itemCatalog = itemCatalog;
    this.constraintCatalog = constraintCatalog;
    this.presentationEnvironmentRepository = presentationEnvironmentRepository;
    this.clientBriefRepository = clientBriefRepository;
  }

  async execute(levelId) {
    if (!levelId || typeof levelId !== 'string' || levelId.trim() === '') {
      return { success: false, error: 'INVALID_INPUT: Level ID must be a non-empty string.' };
    }

    try {
      const raw = await this.levelRepository.loadLevel(levelId);
      if (!raw) return { success: false, error: `LEVEL_NOT_FOUND: Level with ID '${levelId}' not found.` };
      if (!raw.id || !raw.roomId || !raw.roomDimensions || !Array.isArray(raw.availableItems)
        || !raw.clientBriefId || !raw.presentationProfileId) {
        return { success: false, error: 'INVALID_LEVEL_DATA: Missing required V2 level references or topology.' };
      }

      const rawBrief = await this.clientBriefRepository.getById(raw.clientBriefId);
      if (!rawBrief) return { success: false, error: `INVALID_LEVEL_DATA: Unknown client brief ${raw.clientBriefId}` };
      const clientBrief = new ClientBrief(rawBrief);
      if (clientBrief.schemaVersion !== 2) {
        return { success: false, error: `INVALID_LEVEL_DATA: Client brief ${clientBrief.id} must use schemaVersion 2` };
      }
      if (clientBrief.levelId !== raw.id) {
        return {
          success: false,
          error: `INVALID_LEVEL_DATA: Client brief ${clientBrief.id} belongs to ${clientBrief.levelId}, not ${raw.id}`
        };
      }

      const bounds = new RoomBounds(raw.roomDimensions.width, raw.roomDimensions.depth);
      const roomState = RoomState.createEmpty(bounds);
      const availableItems = await this.itemCatalog.getItemsByIds(raw.availableItems);
      if (availableItems.length !== raw.availableItems.length) {
        const missing = raw.availableItems.filter(id => !availableItems.some(item => item.id === id));
        return { success: false, error: `INVALID_LEVEL_DATA: Missing catalog items: ${missing.join(', ')}` };
      }

      const presentationEnvironment = await this.presentationEnvironmentRepository.getById(raw.presentationProfileId);
      if (!presentationEnvironment) {
        return { success: false, error: `INVALID_LEVEL_DATA: Unknown presentation profile ${raw.presentationProfileId}` };
      }

      const compositionRules = clientBrief.evaluationPolicy.compositionRules;
      const ergonomicsRules = createErgonomicsRules(
        clientBrief.evaluationPolicy.ergonomicsRules,
        clientBrief.spatialPreferences.clearanceMultiplier
      );
      const styleTargets = await Promise.all(clientBrief.styleTargets.map(async target => {
        const profile = await this.constraintCatalog.getStyleProfileById(target.styleId);
        if (!profile || !Array.isArray(profile.constraints) || profile.constraints.length === 0) {
          throw new Error(`Unknown style constraint profile ${target.styleId}`);
        }
        return Object.freeze({
          styleId: target.styleId,
          label: profile.label,
          role: target.role,
          weight: target.weight,
          constraints: Object.freeze([...profile.constraints])
        });
      }));
      const evaluationSpec = Object.freeze({
        schemaVersion: 1,
        styleTargets: Object.freeze(styleTargets),
        clientPriorities: Object.freeze([...clientBrief.clientPriorities]),
        spatialPreferences: clientBrief.spatialPreferences,
        compositionRules: Object.freeze({ ...compositionRules }),
        ergonomicsRules,
        completion: Object.freeze({ ...clientBrief.evaluationPolicy.completion })
      });

      const itemsById = new Map(availableItems.map(item => [item.id, item]));
      for (const placement of raw.initialPlacement ?? []) {
        const item = itemsById.get(placement.itemId);
        if (!item) return { success: false, error: `INVALID_LEVEL_DATA: Unknown initial item ${placement.itemId}` };
        const result = roomState.placeItem(
          item,
          {
            x: placement.position.x,
            y: placement.position.y ?? 0,
            z: placement.position.z
          },
          placement.rotation?.y ?? 0
        );
        if (!result.success) return { success: false, error: `INVALID_LEVEL_DATA: ${result.error}` };
      }

      return {
        success: true,
        data: new LevelDTO({
          levelId: raw.id,
          roomId: raw.roomId,
          name: raw.name ?? raw.id,
          roomState,
          availableItems,
          styleId: clientBrief.primaryStyleTarget.styleId,
          targetScore: clientBrief.evaluationPolicy.completion.minimumStars,
          presentationEnvironment,
          clientBrief,
          evaluationSpec
        })
      };
    } catch (error) {
      console.error(`LoadLevelUseCase: Unexpected error loading level ${levelId}:`, error);
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default LoadLevelUseCase;
