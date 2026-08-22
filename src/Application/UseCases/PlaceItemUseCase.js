import PlacementResultDTO from '../DTOs/PlacementResultDTO.js';
import { Item } from '../../Domain/Items/Item.js';

function getState(repository, roomId) {
  return repository.getState ? repository.getState(roomId) : repository.loadRoomState(roomId);
}

function saveState(repository, roomId, state) {
  return repository.saveState ? repository.saveState(roomId, state) : repository.saveRoomState(roomId, state);
}

export class PlaceItemUseCase {
  constructor(roomRepository) {
    if (!roomRepository) throw new Error('PlaceItemUseCase: roomRepository is required.');
    this.roomRepository = roomRepository;
  }

  async execute(roomId, item, position, rotation) {
    if (!roomId || typeof roomId !== 'string') return PlacementResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!(item instanceof Item)) return PlacementResultDTO.failure('INVALID_INPUT: A validated catalog Item is required.');
    if (!position || ['x', 'y', 'z'].some(key => typeof position[key] !== 'number')) {
      return PlacementResultDTO.failure('INVALID_INPUT: Valid position {x,y,z} is required.');
    }
    if (!rotation || ['x', 'y', 'z'].some(key => typeof rotation[key] !== 'number')) {
      return PlacementResultDTO.failure('INVALID_INPUT: Valid rotation {x,y,z,w} is required.');
    }

    try {
      const roomState = await getState(this.roomRepository, roomId);
      if (!roomState) return PlacementResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);

      const placement = roomState.placeItem(item, {
        x: position.x,
        y: position.y,
        z: position.z
      }, rotation.y);
      if (!placement.success) return PlacementResultDTO.failure(`PLACEMENT_REJECTED: ${placement.error}`);

      if (!await saveState(this.roomRepository, roomId, roomState)) {
        return PlacementResultDTO.failure('PERSISTENCE_ERROR: Failed to save room state.');
      }
      return PlacementResultDTO.success(placement.data.instanceId, position, rotation);
    } catch (error) {
      console.error(`PlaceItemUseCase: Error placing item ${item.id}:`, error);
      return PlacementResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default PlaceItemUseCase;
