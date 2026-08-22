export class StartLevelSessionUseCase {
  constructor(loadLevelUseCase, roomRepository) {
    if (!loadLevelUseCase || typeof loadLevelUseCase.execute !== 'function') {
      throw new Error('StartLevelSessionUseCase: loadLevelUseCase is required.');
    }
    if (!roomRepository || typeof roomRepository.saveState !== 'function') {
      throw new Error('StartLevelSessionUseCase: roomRepository.saveState is required.');
    }
    this.loadLevelUseCase = loadLevelUseCase;
    this.roomRepository = roomRepository;
  }

  async execute(levelId) {
    if (!levelId || typeof levelId !== 'string') {
      return { success: false, error: 'INVALID_INPUT: LevelID is required.' };
    }
    try {
      const loaded = await this.loadLevelUseCase.execute(levelId);
      if (!loaded.success) return loaded;
      const saved = await this.roomRepository.saveState(loaded.data.roomId, loaded.data.roomState);
      if (!saved) return { success: false, error: 'PERSISTENCE_ERROR: Failed to initialize room state.' };
      return loaded;
    } catch (error) {
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default StartLevelSessionUseCase;
