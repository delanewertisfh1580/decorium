import PlacementResultDTO from '../DTOs/PlacementResultDTO.js';
import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { Item } from '../../Domain/Items/Item.js';
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';

/**
 * Use Case: Place an item in the room.
 * Orchestrates domain logic for item placement.
 */
class PlaceItemUseCase {
  /**
   * @param {import('../Ports/RoomRepository.js').default} roomRepository
   */
  constructor(roomRepository) {
    if (!roomRepository) {
      throw new Error('PlaceItemUseCase: roomRepository is required.');
    }
    this.roomRepository = roomRepository;
  }

  /**
   * Executes the placement of an item.
   * @param {string} roomId - ID of the room.
   * @param {Object} itemData - Raw data of the item to place.
   * @param {Object} position - Position {x, y, z}.
   * @param {Object} rotation - Rotation {x, y, z, w}.
   * @returns {Promise<PlacementResultDTO>}
   */
  async execute(roomId, itemData, position, rotation) {
    // 1. Validate Input
    if (!roomId || typeof roomId !== 'string') {
      return PlacementResultDTO.failure('INVALID_INPUT: RoomID is required.');
    }
    if (!itemData || !itemData.id) {
      return PlacementResultDTO.failure('INVALID_INPUT: Item data with ID is required.');
    }
    if (!position || typeof position.x === 'undefined' || typeof position.y === 'undefined' || typeof position.z === 'undefined') {
      return PlacementResultDTO.failure('INVALID_INPUT: Valid position {x,y,z} is required.');
    }
    if (!rotation || typeof rotation.x === 'undefined' || typeof rotation.y === 'undefined' || typeof rotation.z === 'undefined') {
      return PlacementResultDTO.failure('INVALID_INPUT: Valid rotation {x,y,z,w} is required.');
    }

    try {
      // 2. Load Current State
      let roomState = await this.roomRepository.getState(roomId);
      
      if (!roomState) {
        // If room doesn't exist yet, create a new empty state
        roomState = RoomState.createEmpty();
      }

      // 3. Construct Domain Item
      const featureVector = new FeatureVector(itemData.features || {});
      const item = new Item({
        id: itemData.id,
        name: itemData.name || 'Unknown',
        type: itemData.type || 'generic',
        featureVector: featureVector,
        metadata: itemData.metadata || {}
      });

      // 4. Execute Domain Logic (Add Item to Room)
      // RoomState.addItem returns a NEW RoomState instance (immutable pattern)
      const newRoomState = roomState.addItem(item);

      // 5. Persist New State
      const saved = await this.roomRepository.saveState(roomId, newRoomState);

      if (!saved) {
        return PlacementResultDTO.failure('PERSISTENCE_ERROR: Failed to save room state.');
      }

      // 6. Return Success
      return PlacementResultDTO.success(item.id, position, rotation);

    } catch (error) {
      console.error(`PlaceItemUseCase: Error placing item ${itemData?.id || 'unknown'}:`, error);
      return PlacementResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default PlaceItemUseCase;
