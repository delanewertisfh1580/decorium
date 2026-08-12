import MoveResultDTO from '../DTOs/MoveResultDTO.js';

function getState(repository, roomId) {
  return repository.getState ? repository.getState(roomId) : repository.loadRoomState(roomId);
}

function saveState(repository, roomId, state) {
  return repository.saveState ? repository.saveState(roomId, state) : repository.saveRoomState(roomId, state);
}

export class MoveItemUseCase {
  constructor(roomRepository) {
    if (!roomRepository) throw new Error('MoveItemUseCase: roomRepository is required.');
    this.roomRepository = roomRepository;
  }

  async execute(roomId, itemId, newPosition) {
    if (!roomId || typeof roomId !== 'string') return MoveResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!itemId || typeof itemId !== 'string') return MoveResultDTO.failure('INVALID_INPUT: ItemID is required.');
    if (!newPosition || ['x', 'y', 'z'].some(key => typeof newPosition[key] !== 'number')) {
      return MoveResultDTO.failure('INVALID_INPUT: New position must contain x, y, z numbers.');
    }

    try {
      const roomState = await getState(this.roomRepository, roomId);
      if (!roomState) return MoveResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      if (!roomState.getItem(itemId)) return MoveResultDTO.failure(`ITEM_NOT_FOUND: Item ${itemId} not found in room.`);

      const result = roomState.moveItem(itemId, {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z
      });
      const success = typeof result === 'boolean' ? result : result.success;
      if (!success) return MoveResultDTO.failure(`MOVE_REJECTED: ${result.error ?? 'Domain rule violation.'}`);

      await saveState(this.roomRepository, roomId, roomState);
      return MoveResultDTO.success(itemId, newPosition);
    } catch (error) {
      console.error(`MoveItemUseCase: Error moving item ${itemId} in room ${roomId}:`, error);
      return MoveResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default MoveItemUseCase;
