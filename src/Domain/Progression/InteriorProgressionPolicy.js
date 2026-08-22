import PlayerProfile from '../Profile/PlayerProfile.js';

function validateReward(reward) {
  if (!reward || typeof reward.id !== 'string' || typeof reward.levelId !== 'string'
    || !Number.isInteger(reward.minimumStars) || !Array.isArray(reward.grantUnlockIds)) {
    throw new Error('InteriorProgressionPolicy rewards must use the authored reward contract.');
  }
}

export class InteriorProgressionPolicy {
  eligibleRewards({ rewards, profile, levelId, stars }) {
    if (!(profile instanceof PlayerProfile)) throw new Error('InteriorProgressionPolicy requires a PlayerProfile.');
    if (!Array.isArray(rewards)) throw new Error('InteriorProgressionPolicy rewards must be an array.');
    if (typeof levelId !== 'string' || !Number.isInteger(stars)) throw new Error('InteriorProgressionPolicy requires levelId and integer stars.');
    return Object.freeze(rewards
      .map(reward => { validateReward(reward); return reward; })
      .filter(reward => reward.levelId === levelId && stars >= reward.minimumStars && !profile.inventory.grantedRewardIds.includes(reward.id))
      .map(reward => Object.freeze({ id: reward.id, grantUnlockIds: Object.freeze([...reward.grantUnlockIds]) })));
  }
}

export default InteriorProgressionPolicy;
