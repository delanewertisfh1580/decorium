import { RoomState } from '../../Domain/Rooms/RoomState.js';
import RoomStateResultDTO from '../DTOs/RoomStateResultDTO.js';

export class ResetRoomAttemptUseCase {
  constructor(roomRepository) {
    if (!roomRepository || typeof roomRepository.getState !== 'function' || typeof roomRepository.saveState !== 'function') {
      throw new Error('ResetRoomAttemptUseCase: roomRepository.getState and roomRepository.saveState are required.');
    }
    this.roomRepository = roomRepository;
  }

  async execute(roomId) {
    if (!roomId || typeof roomId !== 'string') {
      return RoomStateResultDTO.failure('INVALID_INPUT: RoomID is required.');
    }
    try {
      const currentState = await this.roomRepository.getState(roomId);
      if (!currentState) return RoomStateResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      const emptyState = RoomState.createEmpty(currentState.bounds);
      const saved = await this.roomRepository.saveState(roomId, emptyState);
      if (!saved) return RoomStateResultDTO.failure('PERSISTENCE_ERROR: Failed to reset room state.');
      return RoomStateResultDTO.success(emptyState);
    } catch (error) {
      return RoomStateResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default ResetRoomAttemptUseCase;
