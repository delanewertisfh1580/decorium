import RemoveResultDTO from '../DTOs/RemoveResultDTO.js';

export class RemoveItemUseCase {
  constructor(roomRepository) {
    if (!roomRepository) throw new Error('RemoveItemUseCase: roomRepository is required.');
    this.roomRepository = roomRepository;
  }

  async execute(roomId, instanceId) {
    if (!roomId || typeof roomId !== 'string') return RemoveResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!instanceId || typeof instanceId !== 'string') return RemoveResultDTO.failure('INVALID_INPUT: InstanceID is required.');

    try {
      const roomState = await this.roomRepository.getState(roomId);
      if (!roomState) return RemoveResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      if (!roomState.getItem(instanceId)) return RemoveResultDTO.failure(`INSTANCE_NOT_FOUND: Instance ${instanceId} not found in room.`);

      const removal = roomState.removeItem(instanceId);
      if (!removal.success) return RemoveResultDTO.failure(`REMOVAL_REJECTED: ${removal.error}`);
      await this.roomRepository.saveState(roomId, roomState);
      return RemoveResultDTO.success(instanceId, roomState.getItemCount());
    } catch (error) {
      console.error(`RemoveItemUseCase: Error removing instance ${instanceId} from room ${roomId}:`, error);
      return RemoveResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default RemoveItemUseCase;
