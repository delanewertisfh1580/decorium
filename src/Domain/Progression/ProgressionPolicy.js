import LevelSummary from '../Levels/LevelSummary.js';
import PlayerProfile from '../Profile/PlayerProfile.js';

export class ProgressionPolicy {
  evaluate(levels, profile) {
    if (!Array.isArray(levels) || !levels.every(level => level instanceof LevelSummary)) {
      throw new Error('ProgressionPolicy levels must be an array of LevelSummary');
    }
    if (!(profile instanceof PlayerProfile)) {
      throw new Error('ProgressionPolicy profile must be a PlayerProfile');
    }

    const levelIds = new Set(levels.map(level => level.id));
    const completedLevels = profile.progress.completedLevels;
    return levels.map(level => {
      const prerequisiteLevelId = level.prerequisiteLevelId;
      if (prerequisiteLevelId && !levelIds.has(prerequisiteLevelId)) {
        throw new Error(`ProgressionPolicy prerequisite ${prerequisiteLevelId} is absent from campaign`);
      }
      const completion = completedLevels[level.id] ?? null;
      return Object.freeze({
        levelId: level.id,
        isUnlocked: prerequisiteLevelId === null || Boolean(completedLevels[prerequisiteLevelId]),
        prerequisiteLevelId,
        bestStars: completion?.bestStars ?? null
      });
    });
  }
}

export default ProgressionPolicy;
