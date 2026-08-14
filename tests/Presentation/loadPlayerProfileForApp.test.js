// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../src/Domain/Profile/PlayerProfile.js';
import { loadPlayerProfileForApp } from '../../src/Presentation/bootstrap/loadPlayerProfileForApp.js';

const profile = PlayerProfile.create({
  profileId: 'profile-001',
  timestamp: '2026-08-13T09:30:00.000Z'
}).withReducedMotion(true, '2026-08-13T09:31:00.000Z');

describe('loadPlayerProfileForApp', () => {
  it('renders the application profile state and applies the persisted motion preference', async () => {
    const container = document.createElement('aside');
    const root = document.createElement('main');
    const loadPlayerProfileUseCase = {
      execute: async () => ({ success: true, status: 'restored', data: profile })
    };

    const result = await loadPlayerProfileForApp({
      loadPlayerProfileUseCase,
      profileContainer: container,
      appRoot: root
    });

    expect(result).toBe(profile);
    expect(container.querySelector('[data-profile-status]').dataset.profileState).toBe('restored');
    expect(root.dataset.reducedMotion).toBe('true');
  });

  it('stops bootstrap with a meaningful error when profile loading fails', async () => {
    await expect(loadPlayerProfileForApp({
      loadPlayerProfileUseCase: { execute: async () => ({ success: false, error: 'PERSISTENCE_ERROR: storage denied' }) },
      profileContainer: document.createElement('aside'),
      appRoot: document.createElement('main')
    })).rejects.toThrow('PERSISTENCE_ERROR: storage denied');
  });
});
