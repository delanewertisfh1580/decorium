import { describe, expect, it, vi } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';
import UpdatePlayerSettingsUseCase from '../../../src/Application/UseCases/UpdatePlayerSettingsUseCase.js';

function createProfile() {
  return PlayerProfile.create({
    profileId: 'profile-001',
    timestamp: '2026-08-14T10:00:00.000Z'
  });
}

describe('UpdatePlayerSettingsUseCase', () => {
  it('validates, persists and returns a new profile with merged preference changes', async () => {
    const savePlayerProfileUseCase = { execute: vi.fn(async profile => ({ success: true, data: profile })) };
    const useCase = new UpdatePlayerSettingsUseCase(
      savePlayerProfileUseCase,
      () => '2026-08-14T10:05:00.000Z'
    );

    const result = await useCase.execute(createProfile(), {
      reducedMotion: true,
      uiScale: 'large',
      qualityTier: 'performance'
    });

    expect(savePlayerProfileUseCase.execute).toHaveBeenCalledTimes(1);
    expect(savePlayerProfileUseCase.execute.mock.calls[0][0].settings).toEqual({
      reducedMotion: true,
      uiScale: 'large',
      qualityTier: 'performance'
    });
    expect(result).toMatchObject({ success: true });
    expect(result.data.updatedAt).toBe('2026-08-14T10:05:00.000Z');
  });

  it('rejects an unsupported settings request without persisting a profile', async () => {
    const savePlayerProfileUseCase = { execute: vi.fn() };
    const useCase = new UpdatePlayerSettingsUseCase(
      savePlayerProfileUseCase,
      () => '2026-08-14T10:05:00.000Z'
    );

    const result = await useCase.execute(createProfile(), { uiScale: 'zoomed' });

    expect(result).toEqual({ success: false, error: 'INVALID_SETTINGS: Unsupported player settings.' });
    expect(savePlayerProfileUseCase.execute).not.toHaveBeenCalled();
  });
});
