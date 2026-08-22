import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';
import PlayerSettings from '../../../src/Domain/Profile/PlayerSettings.js';

describe('PlayerProfile settings v4', () => {
  it('creates schema v4 profiles with complete persisted player settings', () => {
    const profile = PlayerProfile.create({
      profileId: 'profile-001',
      timestamp: '2026-08-14T10:00:00.000Z'
    });

    expect(profile.schemaVersion).toBe(4);
    expect(profile.settings).toEqual({
      reducedMotion: false,
      uiScale: 'standard',
      qualityTier: 'balanced'
    });
  });

  it('returns a new profile when validated player settings change without mutating profile progress', () => {
    const profile = PlayerProfile.create({
      profileId: 'profile-001',
      timestamp: '2026-08-14T10:00:00.000Z'
    }).recordLevelCompletion({
      levelId: 'level-001',
      stars: 3,
      updatedAt: '2026-08-14T10:01:00.000Z'
    });
    const settings = PlayerSettings.fromData({
      reducedMotion: true,
      uiScale: 'large',
      qualityTier: 'performance'
    });

    const updated = profile.withSettings(settings, '2026-08-14T10:02:00.000Z');

    expect(updated).not.toBe(profile);
    expect(updated.settings).toEqual(settings.toJSON());
    expect(updated.progress).toEqual(profile.progress);
    expect(updated.updatedAt).toBe('2026-08-14T10:02:00.000Z');
  });
});
