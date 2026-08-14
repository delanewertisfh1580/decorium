import PlayerProfile from '../../Domain/Profile/PlayerProfile.js';

export class RecordLevelCompletionUseCase {
  constructor(savePlayerProfileUseCase, timestampProvider) {
    if (!savePlayerProfileUseCase || typeof savePlayerProfileUseCase.execute !== 'function') {
      throw new Error('RecordLevelCompletionUseCase: savePlayerProfileUseCase is required.');
    }
    if (typeof timestampProvider !== 'function') {
      throw new Error('RecordLevelCompletionUseCase: timestampProvider is required.');
    }
    this.savePlayerProfileUseCase = savePlayerProfileUseCase;
    this.timestampProvider = timestampProvider;
  }

  async execute({ levelId, stars, targetScore, profile }) {
    if (!(profile instanceof PlayerProfile)) {
      return { success: false, error: 'INVALID_PROFILE: PlayerProfile domain object is required.' };
    }
    if (!Number.isInteger(stars) || !Number.isInteger(targetScore) || stars < 0 || stars > 5 || targetScore < 0 || targetScore > 5) {
      return { success: false, error: 'INVALID_COMPLETION_SCORE: stars and targetScore must be integers between 0 and 5.' };
    }

    if (stars < targetScore) {
      return { success: true, data: profile, didComplete: false };
    }

    const completedProfile = profile.recordLevelCompletion({
      levelId,
      stars,
      updatedAt: this.timestampProvider()
    });
    const saved = await this.savePlayerProfileUseCase.execute(completedProfile);
    if (!saved.success) return { ...saved, didComplete: false };

    return { success: true, data: saved.data, didComplete: true };
  }
}

export default RecordLevelCompletionUseCase;
