export class StartLevelSessionUseCase {
  constructor(loadLevelUseCase, roomRepository, getPlayerProfile = () => null) {
    if (!loadLevelUseCase || typeof loadLevelUseCase.execute !== 'function') throw new Error('StartLevelSessionUseCase: loadLevelUseCase is required.');
    if (!roomRepository || typeof roomRepository.saveState !== 'function') throw new Error('StartLevelSessionUseCase: roomRepository.saveState is required.');
    if (typeof getPlayerProfile !== 'function') throw new Error('StartLevelSessionUseCase: getPlayerProfile must be a function.');
    this.loadLevelUseCase = loadLevelUseCase;
    this.roomRepository = roomRepository;
    this.getPlayerProfile = getPlayerProfile;
  }

  async execute(levelId) {
    if (!levelId || typeof levelId !== 'string') return { success: false, error: 'INVALID_INPUT: LevelID is required.' };
    try {
      const loaded = await this.loadLevelUseCase.execute(levelId);
      if (!loaded.success) return loaded;
      const profile = this.getPlayerProfile();
      if (this.roomRepository.associate) {
        if (!profile?.profileId) return { success: false, error: 'PROFILE_REQUIRED: Cannot persist room design without a profile.' };
        this.roomRepository.associate(loaded.data.roomId, {
          profileId: profile.profileId,
          levelId: loaded.data.levelId,
          baselineRoomState: loaded.data.baselineRoomState
        });
      }
      const saved = await this.roomRepository.saveState(loaded.data.roomId, loaded.data.roomState);
      if (!saved) return { success: false, error: 'PERSISTENCE_ERROR: Failed to initialize room state.' };
      return loaded;
    } catch (error) {
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default StartLevelSessionUseCase;
