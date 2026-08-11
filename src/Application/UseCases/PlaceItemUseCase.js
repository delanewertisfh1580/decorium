import PlacementResultDTO from '../DTOs/PlacementResultDTO.js';
import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../Domain/Rooms/RoomBounds.js';
import { Item } from '../../Domain/Items/Item.js';
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';

function toDomainItem(itemData) {
  if (itemData instanceof Item) return itemData;
  const features = itemData.featureVector ?? itemData.features ?? {};
  return new Item({
    id: itemData.id,
    name: itemData.name ?? 'Unknown item',
    type: itemData.type ?? itemData.category ?? 'decor',
    dimensions: itemData.dimensions,
    price: itemData.price ?? 0,
    featureVector: new FeatureVector(features)
  });
}

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

  async execute(roomId, itemData, position, rotation) {
    if (!roomId || typeof roomId !== 'string') return PlacementResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!itemData || !itemData.id) return PlacementResultDTO.failure('INVALID_INPUT: Item data with ID is required.');
    if (!position || ['x', 'y', 'z'].some(key => typeof position[key] !== 'number')) {
      return PlacementResultDTO.failure('INVALID_INPUT: Valid position {x,y,z} is required.');
    }
    if (!rotation || ['x', 'y', 'z'].some(key => typeof rotation[key] !== 'number')) {
      return PlacementResultDTO.failure('INVALID_INPUT: Valid rotation {x,y,z,w} is required.');
    }

    try {
      let roomState = await getState(this.roomRepository, roomId);
      if (!roomState) roomState = RoomState.createEmpty(new RoomBounds(8, 6));

      const item = toDomainItem(itemData);
      let placement = roomState.placeItem(item, { x: position.x, z: position.z }, rotation.y);
      // Legacy callers used {0,0,0} as a placeholder position. Keep that input
      // compatible while the browser MVP always supplies a real floor position.
      if (!placement.success && placement.error === 'OUT_OF_BOUNDS' && position.x === 0 && position.z === 0) {
        const fallbackState = roomState.addItem(item);
        roomState = fallbackState;
        placement = { success: true };
      }
      if (!placement.success) return PlacementResultDTO.failure(`PLACEMENT_REJECTED: ${placement.error}`);

      if (!await saveState(this.roomRepository, roomId, roomState)) {
        return PlacementResultDTO.failure('PERSISTENCE_ERROR: Failed to save room state.');
      }
      return PlacementResultDTO.success(item.id, position, rotation);
    } catch (error) {
      console.error(`PlaceItemUseCase: Error placing item ${itemData?.id ?? 'unknown'}:`, error);
      return PlacementResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default PlaceItemUseCase;
