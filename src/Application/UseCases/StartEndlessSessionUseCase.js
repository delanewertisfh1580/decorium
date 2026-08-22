export class StartEndlessSessionUseCase {
  constructor(generateEndlessLevelUseCase, roomRepository) {
    if (!generateEndlessLevelUseCase || typeof generateEndlessLevelUseCase.execute !== 'function') {
      throw new Error('StartEndlessSessionUseCase: generateEndlessLevelUseCase is required.');
    }
    if (!roomRepository || typeof roomRepository.saveState !== 'function' || typeof roomRepository.registerEphemeral !== 'function') {
      throw new Error('StartEndlessSessionUseCase: roomRepository with saveState and registerEphemeral is required.');
    }
    this.generateEndlessLevelUseCase = generateEndlessLevelUseCase;
    this.roomRepository = roomRepository;
  }

  async execute({ seed } = {}) {
    const generated = await this.generateEndlessLevelUseCase.execute({ seed });
    if (!generated.success) return generated;
    try {
      const level = generated.data;
      this.roomRepository.registerEphemeral(level.roomId, level.baselineRoomState);
      const saved = await this.roomRepository.saveState(level.roomId, level.roomState);
      if (!saved) return { success: false, error: 'PERSISTENCE_ERROR: Failed to initialize endless room state.' };
      return generated;
    } catch (error) {
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default StartEndlessSessionUseCase;
