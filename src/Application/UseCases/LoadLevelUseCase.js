import LevelDTO from '../DTOs/LevelDTO.js';
import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../Domain/Rooms/RoomBounds.js';
import { Item } from '../../Domain/Items/Item.js';
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';
import { LinearConstraint } from '../../Domain/Constraints/LinearConstraint.js';

const FEATURE_ALIASES = {
  wood_share: 'woodShare',
  metal_share: 'metalShare',
  glass_share: 'glassShare',
  plastic_share: 'plasticShare',
  fabric_share: 'textileShare',
  textile_share: 'textileShare',
  lightcolorshare: 'lightColorShare',
  light_color_share: 'lightColorShare',
  dark_color_share: 'darkColorShare',
  warmpaletteshare: 'warmPaletteShare',
  color_temperature: 'warmPaletteShare',
  saturation: 'saturationLevel',
  form_simplicity: 'formSimplicity',
  form_complexity: 'formSimplicity'
};

function normalizeFeatureKey(key) {
  return FEATURE_ALIASES[key] ?? key;
}

function createLegacyItem(data) {
  const features = data.featureVector ?? data.features ?? {};
  const normalized = { ...features };
  for (const [key, value] of Object.entries(features)) {
    normalized[normalizeFeatureKey(key)] = value;
  }
  return new Item({
    id: data.id,
    name: data.name ?? 'Unknown item',
    type: data.type ?? data.category ?? 'decor',
    dimensions: data.dimensions,
    price: data.price ?? 0,
    featureVector: new FeatureVector(normalized)
  });
}

function createConstraint(data) {
  const operator = data.operator === '>=' ? 'gte' : data.operator === '<=' ? 'lte' : data.operator;
  return new LinearConstraint(
    normalizeFeatureKey(data.featureKey ?? data.feature),
    operator,
    data.threshold,
    data.id ?? null,
    data.weight ?? 1,
    data.messageKey ?? null
  );
}

export class LoadLevelUseCase {
  constructor(levelRepository, itemCatalog = null, constraintCatalog = null) {
    if (!levelRepository) throw new Error('LoadLevelUseCase: levelRepository is required.');
    this.levelRepository = levelRepository;
    this.itemCatalog = itemCatalog;
    this.constraintCatalog = constraintCatalog;
  }

  async execute(levelId) {
    if (!levelId || typeof levelId !== 'string' || levelId.trim() === '') {
      return { success: false, error: 'INVALID_INPUT: Level ID must be a non-empty string.' };
    }

    try {
      const raw = await this.levelRepository.loadLevel(levelId);
      if (!raw) return { success: false, error: `LEVEL_NOT_FOUND: Level with ID '${levelId}' not found.` };

      if (!raw.roomId && !raw.roomDimensions) {
        return { success: false, error: 'INVALID_LEVEL_DATA: Missing roomId or roomDimensions.' };
      }
      const roomId = raw.roomId ?? raw.id;
      if (!roomId) return { success: false, error: 'INVALID_LEVEL_DATA: Missing roomId.' };

      const dimensions = raw.roomDimensions ?? { width: 5, depth: 5 };
      const bounds = new RoomBounds(dimensions.width, dimensions.depth);
      const roomState = RoomState.createEmpty(bounds);

      let availableItems;
      if (this.itemCatalog && Array.isArray(raw.availableItems)) {
        availableItems = await this.itemCatalog.getItemsByIds(raw.availableItems);
      } else {
        availableItems = (raw.items ?? []).map(createLegacyItem);
      }

      if (Array.isArray(raw.availableItems) && availableItems.length !== raw.availableItems.length) {
        const missing = raw.availableItems.filter(id => !availableItems.some(item => item.id === id));
        return { success: false, error: `INVALID_LEVEL_DATA: Missing catalog items: ${missing.join(', ')}` };
      }

      let constraints;
      if (this.constraintCatalog && raw.styleId) {
        constraints = await this.constraintCatalog.getConstraintsByStyleId(raw.styleId);
      } else {
        constraints = (raw.constraints ?? []).map(createConstraint);
      }

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
          levelId: raw.id ?? levelId,
          roomId,
          name: raw.name ?? levelId,
          roomState,
          availableItems,
          constraints,
          styleId: raw.styleId ?? 'default',
          targetScore: raw.targetScore ?? 3,
          compositionRules: raw.compositionRules ?? {}
        })
      };
    } catch (error) {
      console.error(`LoadLevelUseCase: Unexpected error loading level ${levelId}:`, error);
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default LoadLevelUseCase;
