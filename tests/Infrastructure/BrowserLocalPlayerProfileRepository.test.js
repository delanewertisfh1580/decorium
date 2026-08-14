import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../src/Domain/Profile/PlayerProfile.js';
import BrowserLocalPlayerProfileRepository from '../../src/Infrastructure/Repositories/BrowserLocalPlayerProfileRepository.js';

const PROFILE_KEY = 'decorium.player-profile';
const timestamp = '2026-08-13T09:30:00.000Z';

class MemoryStorage {
  constructor(values = {}) {
    this.values = new Map(Object.entries(values));
    this.removeCalls = [];
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }

  removeItem(key) {
    this.removeCalls.push(key);
    this.values.delete(key);
  }
}

function createProfile(profileId = 'profile-001') {
  return PlayerProfile.create({ profileId, timestamp });
}

describe('BrowserLocalPlayerProfileRepository', () => {
  it('reports a missing profile without writing to storage', async () => {
    const storage = new MemoryStorage();
    const repository = new BrowserLocalPlayerProfileRepository(storage, PROFILE_KEY);

    await expect(repository.load()).resolves.toEqual({ profile: null, status: 'missing' });
    expect(storage.values.size).toBe(0);
  });

  it('serializes a valid domain profile and restores the same profile', async () => {
    const storage = new MemoryStorage();
    const repository = new BrowserLocalPlayerProfileRepository(storage, PROFILE_KEY);
    const profile = createProfile();

    await expect(repository.save(profile)).resolves.toBe(true);
    expect(JSON.parse(storage.getItem(PROFILE_KEY))).toEqual(profile.toJSON());

    const restored = await repository.load();
    expect(restored.status).toBe('restored');
    expect(restored.profile).toBeInstanceOf(PlayerProfile);
    expect(restored.profile.toJSON()).toEqual(profile.toJSON());
  });

  it('migrates supported v0 data to v1 and persists the migrated contract', async () => {
    const storage = new MemoryStorage({
      [PROFILE_KEY]: JSON.stringify({
        schemaVersion: 0,
        profileId: 'legacy-profile-001',
        createdAt: timestamp,
        updatedAt: timestamp,
        reducedMotion: true,
        lastLevelId: 'level-001'
      })
    });
    const repository = new BrowserLocalPlayerProfileRepository(storage, PROFILE_KEY);

    const result = await repository.load();

    expect(result.status).toBe('migrated');
    expect(result.profile.toJSON()).toMatchObject({
      schemaVersion: 1,
      profileId: 'legacy-profile-001',
      settings: { reducedMotion: true },
      lastSession: { levelId: 'level-001' }
    });
    expect(JSON.parse(storage.getItem(PROFILE_KEY)).schemaVersion).toBe(1);
  });

  it('removes malformed storage data and returns a recovery status instead of throwing', async () => {
    const storage = new MemoryStorage({ [PROFILE_KEY]: '{not-json' });
    const repository = new BrowserLocalPlayerProfileRepository(storage, PROFILE_KEY);

    await expect(repository.load()).resolves.toEqual({ profile: null, status: 'recovered' });
    expect(storage.removeCalls).toEqual([PROFILE_KEY]);
  });

  it('rejects data that does not satisfy the current profile contract', async () => {
    const storage = new MemoryStorage({
      [PROFILE_KEY]: JSON.stringify({
        schemaVersion: 1,
        profileId: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        displayName: null,
        settings: { reducedMotion: false },
        lastSession: { levelId: null }
      })
    });
    const repository = new BrowserLocalPlayerProfileRepository(storage, PROFILE_KEY);

    await expect(repository.load()).resolves.toEqual({ profile: null, status: 'recovered' });
    expect(storage.removeCalls).toEqual([PROFILE_KEY]);
  });

  it('returns false when a storage write fails', async () => {
    const storage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota exceeded'); },
      removeItem: () => {}
    };
    const repository = new BrowserLocalPlayerProfileRepository(storage, PROFILE_KEY);

    await expect(repository.save(createProfile())).resolves.toBe(false);
  });
});
