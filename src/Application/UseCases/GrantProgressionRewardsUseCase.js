import PlayerProfile from '../../Domain/Profile/PlayerProfile.js';
import InteriorProgressionPolicy from '../../Domain/Progression/InteriorProgressionPolicy.js';

export class GrantProgressionRewardsUseCase {
  constructor(rewardCatalog, savePlayerProfileUseCase, timestampProvider, policy = new InteriorProgressionPolicy()) {
    if (!rewardCatalog || typeof rewardCatalog.listRewards !== 'function') throw new Error('GrantProgressionRewardsUseCase: rewardCatalog.listRewards is required.');
    if (!savePlayerProfileUseCase || typeof savePlayerProfileUseCase.execute !== 'function') throw new Error('GrantProgressionRewardsUseCase: savePlayerProfileUseCase is required.');
    if (typeof timestampProvider !== 'function') throw new Error('GrantProgressionRewardsUseCase: timestampProvider is required.');
    if (!(policy instanceof InteriorProgressionPolicy)) throw new Error('GrantProgressionRewardsUseCase: policy must be an InteriorProgressionPolicy.');
    this.rewardCatalog = rewardCatalog;
    this.savePlayerProfileUseCase = savePlayerProfileUseCase;
    this.timestampProvider = timestampProvider;
    this.policy = policy;
  }

  async execute({ profile, levelId, stars }) {
    if (!(profile instanceof PlayerProfile) || typeof levelId !== 'string' || !Number.isInteger(stars)) {
      return Object.freeze({ success: false, error: 'INVALID_INPUT' });
    }
    try {
      const rewards = await this.rewardCatalog.listRewards();
      const eligible = this.policy.eligibleRewards({ rewards, profile, levelId, stars });
      let nextProfile = profile;
      for (const reward of eligible) {
        nextProfile = nextProfile.grantReward({ rewardId: reward.id, unlockIds: reward.grantUnlockIds, updatedAt: this.timestampProvider() });
      }
      if (nextProfile === profile) return Object.freeze({ success: true, data: profile, grantedRewardIds: Object.freeze([]) });
      const saved = await this.savePlayerProfileUseCase.execute(nextProfile);
      if (!saved.success) return Object.freeze({ success: false, error: saved.error ?? 'PERSISTENCE_ERROR' });
      return Object.freeze({ success: true, data: saved.data, grantedRewardIds: Object.freeze(eligible.map(reward => reward.id)) });
    } catch (error) {
      console.error('GrantProgressionRewardsUseCase: Failed to grant rewards:', error);
      return Object.freeze({ success: false, error: `UNEXPECTED_ERROR: ${error.message}` });
    }
  }
}

export default GrantProgressionRewardsUseCase;
