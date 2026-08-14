import { describe, expect, it } from 'vitest';
import BrowserLocalPlayerProfileRepository from '../../src/Infrastructure/Repositories/BrowserLocalPlayerProfileRepository.js';

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    read: key => values.get(key) ?? null
  };
}

describe('BrowserLocalPlayerProfileRepository settings migration', () => {
  it('migrates schema v2 settings to v3 defaults and persists the versioned replacement', async () => {
    const storage = createMemoryStorage({
      'decorium.player-profile': JSON.stringify({
        schemaVersion: 2,
        profileId: 'profile-001',
        createdAt: '2026-08-14T10:00:00.000Z',
        updatedAt: '2026-08-14T10:01:00.000Z',
        displayName: null,
        settings: { reducedMotion: true },
        lastSession: { levelId: 'level-002' },
        progress: { completedLevels: {} }
      })
    });
    const repository = new BrowserLocalPlayerProfileRepository(storage);

    const result = await repository.load();

    expect(result.status).toBe('migrated');
    expect(result.profile.schemaVersion).toBe(3);
    expect(result.profile.settings).toEqual({
      reducedMotion: true,
      uiScale: 'standard',
      qualityTier: 'balanced'
    });
    expect(JSON.parse(storage.read('decorium.player-profile')).schemaVersion).toBe(3);
  });
});
