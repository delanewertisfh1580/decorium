import RoomStateResultDTO from '../DTOs/RoomStateResultDTO.js';

export class ReadRoomStateUseCase {
  constructor(roomRepository) {
    if (!roomRepository || typeof roomRepository.getState !== 'function') {
      throw new Error('ReadRoomStateUseCase: roomRepository.getState is required.');
    }
    this.roomRepository = roomRepository;
  }

  async execute(roomId) {
    if (!roomId || typeof roomId !== 'string') {
      return RoomStateResultDTO.failure('INVALID_INPUT: RoomID is required.');
    }
    try {
      const roomState = await this.roomRepository.getState(roomId);
      if (!roomState) return RoomStateResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      return RoomStateResultDTO.success(roomState);
    } catch (error) {
      return RoomStateResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default ReadRoomStateUseCase;
