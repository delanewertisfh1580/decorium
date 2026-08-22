function getState(repository, roomId) {
  return repository.getState ? repository.getState(roomId) : repository.loadRoomState(roomId);
}

function saveState(repository, roomId, state) {
  return repository.saveState ? repository.saveState(roomId, state) : repository.saveRoomState(roomId, state);
}

export class ConfigureRoomSurfaceUseCase {
  constructor(roomRepository, surfaceFinishCatalog, getPlayerProfile = () => null) {
    if (!roomRepository) throw new Error('ConfigureRoomSurfaceUseCase: roomRepository is required.');
    if (!surfaceFinishCatalog || typeof surfaceFinishCatalog.getById !== 'function') {
      throw new Error('ConfigureRoomSurfaceUseCase: surfaceFinishCatalog.getById is required.');
    }
    if (typeof getPlayerProfile !== 'function') throw new Error('ConfigureRoomSurfaceUseCase: getPlayerProfile must be a function.');
    this.roomRepository = roomRepository;
    this.surfaceFinishCatalog = surfaceFinishCatalog;
    this.getPlayerProfile = getPlayerProfile;
  }

  async execute(roomId, surface, finishId) {
    if (typeof roomId !== 'string' || roomId.trim() === '' || !['floor', 'wall'].includes(surface)
      || typeof finishId !== 'string' || finishId.trim() === '') {
      return Object.freeze({ success: false, error: 'INVALID_INPUT' });
    }
    try {
      const finish = await this.surfaceFinishCatalog.getById(finishId);
      if (!finish || finish.surface !== surface) return Object.freeze({ success: false, error: 'UNKNOWN_SURFACE_FINISH' });
      const profile = this.getPlayerProfile();
      if (!profile || typeof profile.hasUnlock !== 'function' || !profile.hasUnlock(finish.unlockId)) {
        return Object.freeze({ success: false, error: 'SURFACE_FINISH_LOCKED' });
      }
      const state = await getState(this.roomRepository, roomId);
      if (!state) return Object.freeze({ success: false, error: 'ROOM_NOT_FOUND' });
      const result = state.configureSurface(surface, finishId);
      if (!result.success) return Object.freeze({ success: false, error: result.error });
      if (!await saveState(this.roomRepository, roomId, state)) return Object.freeze({ success: false, error: 'PERSISTENCE_ERROR' });
      return Object.freeze({ success: true, data: result.data });
    } catch (error) {
      console.error(`ConfigureRoomSurfaceUseCase: Error configuring ${surface}:`, error);
      return Object.freeze({ success: false, error: `UNEXPECTED_ERROR: ${error.message}` });
    }
  }
}

export default ConfigureRoomSurfaceUseCase;
