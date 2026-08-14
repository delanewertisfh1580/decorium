import { describe, expect, it } from 'vitest';
import LevelSummary from '../../../src/Domain/Levels/LevelSummary.js';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';
import ProgressionPolicy from '../../../src/Domain/Progression/ProgressionPolicy.js';

const timestamp = '2026-08-14T11:00:00.000Z';
const levels = [
  new LevelSummary({ id: 'level-001', name: 'Первый', description: 'Первый', sortOrder: 1 }),
  new LevelSummary({ id: 'level-002', name: 'Второй', description: 'Второй', sortOrder: 2, prerequisiteLevelId: 'level-001' }),
  new LevelSummary({ id: 'level-003', name: 'Третий', description: 'Третий', sortOrder: 3, prerequisiteLevelId: 'level-002' })
];

describe('ProgressionPolicy', () => {
  it('unlocks the entry level and keeps subsequent levels locked until their prerequisite is completed', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp });

    const result = new ProgressionPolicy().evaluate(levels, profile);

    expect(result).toEqual([
      { levelId: 'level-001', isUnlocked: true, prerequisiteLevelId: null, bestStars: null },
      { levelId: 'level-002', isUnlocked: false, prerequisiteLevelId: 'level-001', bestStars: null },
      { levelId: 'level-003', isUnlocked: false, prerequisiteLevelId: 'level-002', bestStars: null }
    ]);
  });

  it('unlocks one level at a time and exposes the preserved best-stars result', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp })
      .recordLevelCompletion({ levelId: 'level-001', stars: 4, updatedAt: '2026-08-14T11:05:00.000Z' });

    const result = new ProgressionPolicy().evaluate(levels, profile);

    expect(result[0]).toEqual({ levelId: 'level-001', isUnlocked: true, prerequisiteLevelId: null, bestStars: 4 });
    expect(result[1].isUnlocked).toBe(true);
    expect(result[2].isUnlocked).toBe(false);
  });

  it('rejects a prerequisite that is absent from the authored campaign', () => {
    const invalidLevels = [new LevelSummary({
      id: 'level-002', name: 'Broken', description: 'Broken', sortOrder: 2, prerequisiteLevelId: 'missing-level'
    })];

    expect(() => new ProgressionPolicy().evaluate(invalidLevels, PlayerProfile.create({ profileId: 'profile-001', timestamp }))).toThrow('prerequisite');
  });
});
