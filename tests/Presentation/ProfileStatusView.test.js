// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../src/Domain/Profile/PlayerProfile.js';
import ProfileStatusView from '../../src/Presentation/Views/ProfileStatusView.js';

const profile = PlayerProfile.create({
  profileId: 'profile-001',
  timestamp: '2026-08-13T09:30:00.000Z'
});

describe('ProfileStatusView', () => {
  it('renders an accessible, non-blocking status for a newly created local profile', () => {
    const container = document.createElement('aside');
    const view = new ProfileStatusView(container);

    view.render({ status: 'created', profile });

    const status = container.querySelector('[data-profile-status]');
    expect(status).not.toBeNull();
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.dataset.profileState).toBe('created');
    expect(status.textContent).toContain('Создан новый локальный профиль');
  });

  it('explains recovery without exposing profile internals', () => {
    const container = document.createElement('aside');
    const view = new ProfileStatusView(container);

    view.render({ status: 'recovered', profile });

    const status = container.querySelector('[data-profile-status]');
    expect(status.dataset.profileState).toBe('recovered');
    expect(status.textContent).toContain('Профиль восстановлен после проверки данных');
    expect(status.textContent).not.toContain(profile.profileId);
  });

  it('rejects an unknown state instead of silently displaying misleading feedback', () => {
    const view = new ProfileStatusView(document.createElement('aside'));

    expect(() => view.render({ status: 'unknown', profile })).toThrow('Unknown profile status');
  });
});
