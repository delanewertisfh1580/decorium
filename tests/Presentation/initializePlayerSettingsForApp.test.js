// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import PlayerProfile from '../../src/Domain/Profile/PlayerProfile.js';
import { initializePlayerSettingsForApp } from '../../src/Presentation/bootstrap/initializePlayerSettingsForApp.js';

describe('initializePlayerSettingsForApp', () => {
  it('applies persisted preferences to the app and controller on startup', async () => {
    const profile = PlayerProfile.fromData({
      schemaVersion: 3,
      profileId: 'profile-001',
      createdAt: '2026-08-14T10:00:00.000Z',
      updatedAt: '2026-08-14T10:01:00.000Z',
      displayName: null,
      settings: { reducedMotion: true, uiScale: 'large', qualityTier: 'performance' },
      lastSession: { levelId: null },
      progress: { completedLevels: {} }
    });
    const appRoot = document.createElement('main');
    const gameController = { setPlayerProfile: vi.fn(), setPlayerSettings: vi.fn() };

    const result = await initializePlayerSettingsForApp({
      updatePlayerSettingsUseCase: { execute: vi.fn() },
      gameController,
      profile,
      settingsContainer: document.createElement('aside'),
      appRoot
    });

    expect(appRoot.dataset.reducedMotion).toBe('true');
    expect(appRoot.dataset.uiScale).toBe('large');
    expect(appRoot.dataset.qualityTier).toBe('performance');
    expect(gameController.setPlayerProfile).toHaveBeenCalledWith(profile);
    expect(gameController.setPlayerSettings).toHaveBeenCalledWith(profile.settings);
    expect(result.profile).toBe(profile);
  });

  it('persists a settings request and immediately applies the returned profile', async () => {
    const profile = PlayerProfile.create({
      profileId: 'profile-001',
      timestamp: '2026-08-14T10:00:00.000Z'
    });
    const updatedProfile = PlayerProfile.fromData({
      ...profile.toJSON(),
      updatedAt: '2026-08-14T10:05:00.000Z',
      settings: { reducedMotion: true, uiScale: 'large', qualityTier: 'performance' }
    });
    const appRoot = document.createElement('main');
    const settingsContainer = document.createElement('aside');
    const updatePlayerSettingsUseCase = { execute: vi.fn(async () => ({ success: true, data: updatedProfile })) };
    const gameController = { setPlayerProfile: vi.fn(), setPlayerSettings: vi.fn() };

    await initializePlayerSettingsForApp({
      updatePlayerSettingsUseCase,
      gameController,
      profile,
      settingsContainer,
      appRoot
    });

    settingsContainer.querySelector('[data-setting="reducedMotion"]').checked = true;
    settingsContainer.querySelector('[data-setting="uiScale"]').value = 'large';
    settingsContainer.querySelector('[data-setting="qualityTier"]').value = 'performance';
    settingsContainer.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(updatePlayerSettingsUseCase.execute).toHaveBeenCalledWith(profile, {
      reducedMotion: true,
      uiScale: 'large',
      qualityTier: 'performance'
    });
    expect(appRoot.dataset.reducedMotion).toBe('true');
    expect(gameController.setPlayerProfile).toHaveBeenLastCalledWith(updatedProfile);
    expect(gameController.setPlayerSettings).toHaveBeenLastCalledWith(updatedProfile.settings);
  });
});
