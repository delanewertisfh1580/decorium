import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';

describe('PlayerProfile', () => {
  const timestamp = '2026-08-13T09:30:00.000Z';
  const inventory = { unlockedIds: ['base-interior'], grantedRewardIds: [] };

  it('creates an immutable version 4 profile from trusted bootstrap values', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp });
    expect(profile.schemaVersion).toBe(4);
    expect(profile.profileId).toBe('profile-001');
    expect(profile.createdAt).toBe(timestamp);
    expect(profile.updatedAt).toBe(timestamp);
    expect(profile.displayName).toBeNull();
    expect(profile.settings).toEqual({ reducedMotion: false, uiScale: 'standard', qualityTier: 'balanced' });
    expect(profile.lastSession).toEqual({ levelId: null });
    expect(profile.progress).toEqual({ completedLevels: {} });
    expect(profile.inventory).toEqual(inventory);
    expect(Object.isFrozen(profile)).toBe(true);
  });

  it('rebuilds a valid persisted profile without changing its data', () => {
    const profile = PlayerProfile.fromData({
      schemaVersion: 4,
      profileId: 'profile-001',
      createdAt: timestamp,
      updatedAt: '2026-08-13T10:00:00.000Z',
      displayName: '  Alex  ',
      settings: { reducedMotion: true, uiScale: 'large', qualityTier: 'performance' },
      lastSession: { levelId: 'level-002' },
      progress: { completedLevels: {} },
      inventory
    });
    expect(profile.toJSON()).toEqual({
      schemaVersion: 4,
      profileId: 'profile-001',
      createdAt: timestamp,
      updatedAt: '2026-08-13T10:00:00.000Z',
      displayName: 'Alex',
      settings: { reducedMotion: true, uiScale: 'large', qualityTier: 'performance' },
      lastSession: { levelId: 'level-002' },
      progress: { completedLevels: {} },
      inventory
    });
  });

  it('returns a new profile when a supported setting changes', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp });
    const updated = profile.withReducedMotion(true, '2026-08-13T10:00:00.000Z');
    expect(updated).not.toBe(profile);
    expect(updated.settings.reducedMotion).toBe(true);
    expect(updated.createdAt).toBe(timestamp);
    expect(updated.updatedAt).toBe('2026-08-13T10:00:00.000Z');
    expect(profile.settings.reducedMotion).toBe(false);
  });

  it('returns a new profile when the last selected level changes', () => {
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp });
    const updated = profile.withLastSession('level-001', '2026-08-13T10:00:00.000Z');
    expect(updated.lastSession).toEqual({ levelId: 'level-001' });
    expect(updated.updatedAt).toBe('2026-08-13T10:00:00.000Z');
  });

  it.each([
    ['missing profile id', { profileId: '', timestamp }],
    ['invalid timestamp', { profileId: 'profile-001', timestamp: 'not-a-timestamp' }],
    ['blank last session id', { schemaVersion: 4, profileId: 'profile-001', createdAt: timestamp, updatedAt: timestamp, displayName: null, settings: { reducedMotion: false, uiScale: 'standard', qualityTier: 'balanced' }, lastSession: { levelId: ' ' }, progress: { completedLevels: {} }, inventory }],
    ['unsupported schema version', { schemaVersion: 5, profileId: 'profile-001', createdAt: timestamp, updatedAt: timestamp, displayName: null, settings: { reducedMotion: false, uiScale: 'standard', qualityTier: 'balanced' }, lastSession: { levelId: null }, progress: { completedLevels: {} }, inventory }]
  ])('rejects %s', (_label, input) => {
    expect(() => input.schemaVersion === undefined ? PlayerProfile.create(input) : PlayerProfile.fromData(input)).toThrow();
  });
});
