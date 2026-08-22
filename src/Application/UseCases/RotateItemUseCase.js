import RotateResultDTO from '../DTOs/RotateResultDTO.js';

function getState(repository, roomId) {
  return repository.getState ? repository.getState(roomId) : repository.loadRoomState(roomId);
}

function saveState(repository, roomId, state) {
  return repository.saveState ? repository.saveState(roomId, state) : repository.saveRoomState(roomId, state);
}

export class RotateItemUseCase {
  constructor(roomRepository) {
    if (!roomRepository) throw new Error('RotateItemUseCase: roomRepository is required.');
    this.roomRepository = roomRepository;
  }

  async execute(roomId, instanceId, rotationDelta) {
    if (!roomId || typeof roomId !== 'string') return RotateResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!instanceId || typeof instanceId !== 'string') return RotateResultDTO.failure('INVALID_INPUT: InstanceID is required.');
    if (!rotationDelta || typeof rotationDelta.y !== 'number' || rotationDelta.y % 90 !== 0) {
      return RotateResultDTO.failure('INVALID_INPUT: Rotation angle must be a multiple of 90 degrees.');
    }

    try {
      const roomState = await getState(this.roomRepository, roomId);
      if (!roomState) return RotateResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      if (!roomState.getItem(instanceId)) return RotateResultDTO.failure(`INSTANCE_NOT_FOUND: Instance ${instanceId} not found in room.`);

      const result = roomState.rotateItem(instanceId, rotationDelta);
      if (result === null || result === undefined || result.success === false) {
        return RotateResultDTO.failure(`ROTATION_REJECTED: ${result?.error ?? 'Domain rule violation.'}`);
      }

      const stateToSave = result.success === undefined && result !== roomState ? result : roomState;
      await saveState(this.roomRepository, roomId, stateToSave);
      return RotateResultDTO.success(instanceId, { x: 0, y: rotationDelta.y, z: 0 });
    } catch (error) {
      console.error(`RotateItemUseCase: Error rotating instance ${instanceId} in room ${roomId}:`, error);
      return RotateResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default RotateItemUseCase;
