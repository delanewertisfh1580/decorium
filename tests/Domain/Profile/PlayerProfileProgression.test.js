import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';

const createdAt = '2026-08-14T10:00:00.000Z';
const completedAt = '2026-08-14T10:05:00.000Z';

describe('PlayerProfile progression v2', () => {
  it('creates a versioned empty completion record and records level completion immutably', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp: createdAt });
    const completed = profile.recordLevelCompletion({
      levelId: 'level-001',
      stars: 3,
      updatedAt: completedAt
    });

    expect(profile.schemaVersion).toBe(2);
    expect(profile.progress).toEqual({ completedLevels: {} });
    expect(completed.progress).toEqual({
      completedLevels: {
        'level-001': { bestStars: 3, completedAt }
      }
    });
    expect(completed.updatedAt).toBe(completedAt);
    expect(profile.progress.completedLevels).toEqual({});
  });

  it('keeps the best star result while refreshing the completion timestamp', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp: createdAt })
      .recordLevelCompletion({ levelId: 'level-001', stars: 4, updatedAt: completedAt });

    const replayed = profile.recordLevelCompletion({
      levelId: 'level-001',
      stars: 2,
      updatedAt: '2026-08-14T10:10:00.000Z'
    });

    expect(replayed.progress.completedLevels['level-001']).toEqual({
      bestStars: 4,
      completedAt: '2026-08-14T10:10:00.000Z'
    });
  });

  it.each([
    [{ levelId: '', stars: 3, updatedAt: completedAt }],
    [{ levelId: 'level-001', stars: 6, updatedAt: completedAt }],
    [{ levelId: 'level-001', stars: 3.5, updatedAt: completedAt }],
    [{ levelId: 'level-001', stars: 3, updatedAt: 'invalid' }]
  ])('rejects invalid completion input %#', input => {
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp: createdAt });

    expect(() => profile.recordLevelCompletion(input)).toThrow();
  });
});
