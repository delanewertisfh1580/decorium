import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';
import InteriorProgressionPolicy from '../../../src/Domain/Progression/InteriorProgressionPolicy.js';

const timestamp = '2026-08-22T00:00:00.000Z';

describe('interior progression', () => {
  it('grants a reward only once and exposes the unlock entitlement', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-1', timestamp });
    const rewarded = profile.grantReward({ rewardId: 'reward-oak', unlockIds: ['material-oak'], updatedAt: timestamp });
    expect(rewarded.hasUnlock('material-oak')).toBe(true);
    expect(rewarded.inventory.grantedRewardIds).toEqual(['reward-oak']);
    expect(rewarded.grantReward({ rewardId: 'reward-oak', unlockIds: ['material-oak'], updatedAt: timestamp })).toBe(rewarded);
  });

  it('selects only ungranted rewards that satisfy star requirement', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-1', timestamp });
    const rewards = [{ id: 'reward-oak', levelId: 'level-001', minimumStars: 3, grantUnlockIds: ['material-oak'] }];
    expect(new InteriorProgressionPolicy().eligibleRewards({ rewards, profile, levelId: 'level-001', stars: 2 })).toEqual([]);
    expect(new InteriorProgressionPolicy().eligibleRewards({ rewards, profile, levelId: 'level-001', stars: 3 })).toMatchObject([{ id: 'reward-oak' }]);
  });
});
