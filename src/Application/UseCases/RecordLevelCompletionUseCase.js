import PlayerProfile from '../../Domain/Profile/PlayerProfile.js';

export class RecordLevelCompletionUseCase {
  constructor(savePlayerProfileUseCase, timestampProvider, grantProgressionRewardsUseCase = null) {
    if (!savePlayerProfileUseCase || typeof savePlayerProfileUseCase.execute !== 'function') {
      throw new Error('RecordLevelCompletionUseCase: savePlayerProfileUseCase is required.');
    }
    if (typeof timestampProvider !== 'function') {
      throw new Error('RecordLevelCompletionUseCase: timestampProvider is required.');
    }
    if (grantProgressionRewardsUseCase !== null && typeof grantProgressionRewardsUseCase.execute !== 'function') {
      throw new Error('RecordLevelCompletionUseCase: grantProgressionRewardsUseCase must expose execute when supplied.');
    }
    this.savePlayerProfileUseCase = savePlayerProfileUseCase;
    this.timestampProvider = timestampProvider;
    this.grantProgressionRewardsUseCase = grantProgressionRewardsUseCase;
  }

  async execute({ levelId, stars, targetScore, completionEligible, profile }) {
    if (!(profile instanceof PlayerProfile)) {
      return { success: false, error: 'INVALID_PROFILE: PlayerProfile domain object is required.' };
    }
    if (!Number.isInteger(stars) || !Number.isInteger(targetScore) || stars < 0 || stars > 5 || targetScore < 0 || targetScore > 5) {
      return { success: false, error: 'INVALID_COMPLETION_SCORE: stars and targetScore must be integers between 0 and 5.' };
    }

    if (completionEligible !== undefined && typeof completionEligible !== 'boolean') {
      return { success: false, error: 'INVALID_COMPLETION_ELIGIBILITY: completionEligible must be a boolean when supplied.' };
    }

    const eligibleForCompletion = completionEligible ?? stars >= targetScore;
    if (!eligibleForCompletion) {
      return { success: true, data: profile, didComplete: false };
    }

    const completedProfile = profile.recordLevelCompletion({
      levelId,
      stars,
      updatedAt: this.timestampProvider()
    });
    const saved = await this.savePlayerProfileUseCase.execute(completedProfile);
    if (!saved.success) return { ...saved, didComplete: false };

    if (!this.grantProgressionRewardsUseCase) return { success: true, data: saved.data, didComplete: true, grantedRewardIds: [] };
    const rewarded = await this.grantProgressionRewardsUseCase.execute({ profile: saved.data, levelId, stars });
    if (!rewarded.success) return { success: false, error: rewarded.error, didComplete: true, data: saved.data, grantedRewardIds: [] };
    return { success: true, data: rewarded.data, didComplete: true, grantedRewardIds: rewarded.grantedRewardIds };
  }
}

export default RecordLevelCompletionUseCase;
