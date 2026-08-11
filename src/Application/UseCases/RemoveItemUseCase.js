import RemoveResultDTO from '../DTOs/RemoveResultDTO.js';

export class RemoveItemUseCase {
  constructor(roomRepository) {
    if (!roomRepository) throw new Error('RemoveItemUseCase: roomRepository is required.');
    this.roomRepository = roomRepository;
  }

  async execute(roomId, itemId) {
    if (!roomId || typeof roomId !== 'string') return RemoveResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!itemId || typeof itemId !== 'string') return RemoveResultDTO.failure('INVALID_INPUT: ItemID is required.');

    try {
      const roomState = await this.roomRepository.getState(roomId);
      if (!roomState) return RemoveResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      if (!roomState.getItem(itemId)) return RemoveResultDTO.failure(`ITEM_NOT_FOUND: Item ${itemId} not found in room.`);

      const newRoomState = roomState.removeItem(itemId);
      if (!newRoomState) return RemoveResultDTO.failure('REMOVAL_REJECTED: Domain rule violation.');
      await this.roomRepository.saveState(roomId, newRoomState);
      return RemoveResultDTO.success(itemId, newRoomState.getItemCount());
    } catch (error) {
      console.error(`RemoveItemUseCase: Error removing item ${itemId} from room ${roomId}:`, error);
      return RemoveResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default RemoveItemUseCase;
