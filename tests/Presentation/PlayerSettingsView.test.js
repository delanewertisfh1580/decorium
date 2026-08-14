// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import PlayerSettingsView from '../../src/Presentation/Views/PlayerSettingsView.js';

describe('PlayerSettingsView', () => {
  it('renders accessible reduced-motion, UI scale and quality controls from persisted settings', () => {
    const container = document.createElement('aside');
    const view = new PlayerSettingsView(container, vi.fn());

    view.render({ reducedMotion: true, uiScale: 'large', qualityTier: 'performance' });

    const panel = container.querySelector('[data-player-settings]');
    expect(panel).not.toBeNull();
    expect(panel.querySelector('[data-setting="reducedMotion"]').checked).toBe(true);
    expect(panel.querySelector('[data-setting="uiScale"]').value).toBe('large');
    expect(panel.querySelector('[data-setting="qualityTier"]').value).toBe('performance');
    expect(panel.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it('notifies orchestration with a plain settings request after the player saves changes', () => {
    const onSettingsRequested = vi.fn();
    const container = document.createElement('aside');
    const view = new PlayerSettingsView(container, onSettingsRequested);
    view.render({ reducedMotion: false, uiScale: 'standard', qualityTier: 'balanced' });

    container.querySelector('[data-setting="reducedMotion"]').checked = true;
    container.querySelector('[data-setting="uiScale"]').value = 'large';
    container.querySelector('[data-setting="qualityTier"]').value = 'performance';
    container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSettingsRequested).toHaveBeenCalledWith({
      reducedMotion: true,
      uiScale: 'large',
      qualityTier: 'performance'
    });
  });
});
