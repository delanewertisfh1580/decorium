// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../src/Domain/Profile/PlayerProfile.js';
import { initializeLevelSelectForApp } from '../../src/Presentation/bootstrap/initializeLevelSelectForApp.js';

const campaignLevels = [
  {
    id: 'level-001', name: 'Первые шаги', description: 'Освойте основу композиции.', sortOrder: 1,
    prerequisiteLevelId: null, isUnlocked: true, bestStars: 3
  },
  {
    id: 'level-002', name: 'Уютный уголок', description: 'Соберите зону отдыха.', sortOrder: 2,
    prerequisiteLevelId: 'level-001', isUnlocked: true, bestStars: null
  }
];

function profileWithLastSession(levelId) {
  return PlayerProfile.create({
    profileId: 'profile-001',
    timestamp: '2026-08-14T10:00:00.000Z'
  }).withLastSession(levelId, '2026-08-14T10:01:00.000Z');
}

function campaignUseCase(levels = campaignLevels, result = { success: true }) {
  const requestedProfiles = [];
  return {
    requestedProfiles,
    useCase: {
      execute: async profile => {
        requestedProfiles.push(profile);
        return { ...result, data: levels };
      }
    }
  };
}

describe('initializeLevelSelectForApp', () => {
  it('restores an unlocked last campaign level and persists selected session through application use cases', async () => {
    const loaded = [];
    const saved = [];
    const profile = profileWithLastSession('level-002');
    const campaign = campaignUseCase();
    const result = await initializeLevelSelectForApp({
      getCampaignLevelsUseCase: campaign.useCase,
      savePlayerProfileUseCase: { execute: async nextProfile => { saved.push(nextProfile); return { success: true, data: nextProfile }; } },
      gameController: { loadLevel: async levelId => loaded.push(levelId) },
      profile,
      levelSelectContainer: document.createElement('aside'),
      timestampProvider: () => '2026-08-14T10:02:00.000Z'
    });

    expect(campaign.requestedProfiles).toEqual([profile]);
    expect(loaded).toEqual(['level-002']);
    expect(saved).toHaveLength(1);
    expect(saved[0].lastSession.levelId).toBe('level-002');
    expect(result.activeLevelId).toBe('level-002');
  });

  it('falls back to the first unlocked campaign level when the saved session is unavailable or locked', async () => {
    const loaded = [];
    const lockedCampaign = [
      campaignLevels[0],
      { ...campaignLevels[1], isUnlocked: false }
    ];
    const result = await initializeLevelSelectForApp({
      getCampaignLevelsUseCase: campaignUseCase(lockedCampaign).useCase,
      savePlayerProfileUseCase: { execute: async profile => ({ success: true, data: profile }) },
      gameController: { loadLevel: async levelId => loaded.push(levelId) },
      profile: profileWithLastSession('level-002'),
      levelSelectContainer: document.createElement('aside'),
      timestampProvider: () => '2026-08-14T10:02:00.000Z'
    });

    expect(loaded).toEqual(['level-001']);
    expect(result.activeLevelId).toBe('level-001');
  });

  it('returns an actionable error when campaign availability cannot be loaded', async () => {
    await expect(initializeLevelSelectForApp({
      getCampaignLevelsUseCase: campaignUseCase([], { success: false, error: 'INVALID_LEVEL_CATALOG: missing manifest' }).useCase,
      savePlayerProfileUseCase: { execute: async () => ({ success: true }) },
      gameController: { loadLevel: async () => {} },
      profile: profileWithLastSession(null),
      levelSelectContainer: document.createElement('aside'),
      timestampProvider: () => '2026-08-14T10:02:00.000Z'
    })).rejects.toThrow('INVALID_LEVEL_CATALOG: missing manifest');
  });
});
