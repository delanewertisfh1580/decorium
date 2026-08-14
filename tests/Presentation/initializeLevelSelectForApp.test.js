// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../src/Domain/Profile/PlayerProfile.js';
import { initializeLevelSelectForApp } from '../../src/Presentation/bootstrap/initializeLevelSelectForApp.js';

const levels = [
  { id: 'level-001', name: 'Первые шаги', description: 'Освойте основу композиции.', sortOrder: 1 },
  { id: 'level-002', name: 'Уютный уголок', description: 'Соберите зону отдыха.', sortOrder: 2 }
];

function profileWithLastSession(levelId) {
  return PlayerProfile.create({
    profileId: 'profile-001',
    timestamp: '2026-08-14T10:00:00.000Z'
  }).withLastSession(levelId, '2026-08-14T10:01:00.000Z');
}

describe('initializeLevelSelectForApp', () => {
  it('restores the last authored level and persists the selected session through application use cases', async () => {
    const loaded = [];
    const saved = [];
    const result = await initializeLevelSelectForApp({
      listAuthoredLevelsUseCase: { execute: async () => ({ success: true, data: levels }) },
      savePlayerProfileUseCase: { execute: async profile => { saved.push(profile); return { success: true, data: profile }; } },
      gameController: { loadLevel: async levelId => loaded.push(levelId) },
      profile: profileWithLastSession('level-002'),
      levelSelectContainer: document.createElement('aside'),
      timestampProvider: () => '2026-08-14T10:02:00.000Z'
    });

    expect(loaded).toEqual(['level-002']);
    expect(saved).toHaveLength(1);
    expect(saved[0].lastSession.levelId).toBe('level-002');
    expect(result.activeLevelId).toBe('level-002');
  });

  it('falls back to the first authored level when the saved level is no longer available', async () => {
    const loaded = [];
    const result = await initializeLevelSelectForApp({
      listAuthoredLevelsUseCase: { execute: async () => ({ success: true, data: levels }) },
      savePlayerProfileUseCase: { execute: async profile => ({ success: true, data: profile }) },
      gameController: { loadLevel: async levelId => loaded.push(levelId) },
      profile: profileWithLastSession('level-999'),
      levelSelectContainer: document.createElement('aside'),
      timestampProvider: () => '2026-08-14T10:02:00.000Z'
    });

    expect(loaded).toEqual(['level-001']);
    expect(result.activeLevelId).toBe('level-001');
  });

  it('returns an actionable error when authored-level catalog cannot be loaded', async () => {
    await expect(initializeLevelSelectForApp({
      listAuthoredLevelsUseCase: { execute: async () => ({ success: false, error: 'INVALID_LEVEL_CATALOG: missing manifest' }) },
      savePlayerProfileUseCase: { execute: async () => ({ success: true }) },
      gameController: { loadLevel: async () => {} },
      profile: profileWithLastSession(null),
      levelSelectContainer: document.createElement('aside'),
      timestampProvider: () => '2026-08-14T10:02:00.000Z'
    })).rejects.toThrow('INVALID_LEVEL_CATALOG: missing manifest');
  });
});
