import PlacementResultDTO from '../DTOs/PlacementResultDTO.js';
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
      const roomState = await getState(this.roomRepository, roomId);
      if (!roomState) return PlacementResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);

      const item = toDomainItem(itemData);
      let placement = roomState.placeItem(item, {
        x: position.x,
        y: typeof position.y === 'number' ? position.y : 0,
        z: position.z
      }, rotation.y);
      if (!placement.success) return PlacementResultDTO.failure(`PLACEMENT_REJECTED: ${placement.error}`);

      if (!await saveState(this.roomRepository, roomId, roomState)) {
        return PlacementResultDTO.failure('PERSISTENCE_ERROR: Failed to save room state.');
      }
      const placedItems = roomState.getItems().filter(placed => placed.itemId === item.id);
      const placedInstance = placedItems[placedItems.length - 1];
      return PlacementResultDTO.success(placedInstance?.id ?? item.id, position, rotation);
    } catch (error) {
      console.error(`PlaceItemUseCase: Error placing item ${itemData?.id ?? 'unknown'}:`, error);
      return PlacementResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default PlaceItemUseCase;
