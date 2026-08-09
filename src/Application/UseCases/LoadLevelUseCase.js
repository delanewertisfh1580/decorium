import LevelDTO from '../DTOs/LevelDTO.js';
import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { Item } from '../../Domain/Items/Item.js';
import { LinearConstraint } from '../../Domain/Constraints/LinearConstraint.js';
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';

/**
 * UseCase: LoadLevelUseCase
 * Loads a level by ID, validates data, and returns a LevelDTO.
 */
export class LoadLevelUseCase {
  /**
   * @param {LevelRepository} levelRepository
   */
  constructor(levelRepository) {
    if (!levelRepository) {
      throw new Error('LoadLevelUseCase: levelRepository is required.');
    }
    this.levelRepository = levelRepository;
  }

  /**
   * @param {string} levelId
   * @returns {Promise<{success: boolean, data?: LevelDTO, error?: string}>}
   */
  async execute(levelId) {
    // Validate input
    if (!levelId || typeof levelId !== 'string' || levelId.trim() === '') {
      return { success: false, error: 'INVALID_INPUT: Level ID must be a non-empty string.' };
    }

    try {
      const rawData = await this.levelRepository.loadLevel(levelId);

      if (!rawData) {
        return { success: false, error: `LEVEL_NOT_FOUND: Level with ID '${levelId}' not found.` };
      }

      if (!rawData.roomId) {
        console.error(`LoadLevelUseCase: Invalid level data for ${levelId}, missing roomId.`);
        return { success: false, error: 'INVALID_LEVEL_DATA: Missing roomId.' };
      }

      // Build RoomState
      const roomState = new RoomState();
      
      // Map items to Domain Items
      const availableItems = (rawData.items || []).map(itemData => {
        const vector = new FeatureVector(itemData.features || {});
        return new Item({
          id: itemData.id,
          name: itemData.name || 'Unknown Item',
          type: itemData.type || 'generic',
          featureVector: vector,
          metadata: itemData.metadata || {}
        });
      });

      // Map constraints to Domain Constraints
      const constraints = (rawData.constraints || []).map(cData => {
        // Map operator from >= to gte, <= to lte
        let op = cData.operator;
        if (op === '>=') op = 'gte';
        if (op === '<=') op = 'lte';
        
        return new LinearConstraint(
          cData.feature,
          op,
          cData.threshold,
          cData.weight || 1.0
        );
      });

      // Create DTO
      const dto = new LevelDTO(
        rawData.id || levelId,
        rawData.roomId,
        roomState,
        availableItems,
        constraints,
        rawData.styleId || 'default'
      );

      return { success: true, data: dto };

    } catch (error) {
      console.error(`LoadLevelUseCase: Unexpected error loading level ${levelId}:`, error);
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default LoadLevelUseCase;
