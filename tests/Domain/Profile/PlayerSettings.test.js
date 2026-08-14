import { describe, expect, it } from 'vitest';
import PlayerSettings from '../../../src/Domain/Profile/PlayerSettings.js';

describe('PlayerSettings', () => {
  it('provides immutable production defaults for accessibility and rendering preferences', () => {
    const settings = PlayerSettings.createDefault();

    expect(settings.toJSON()).toEqual({
      reducedMotion: false,
      uiScale: 'standard',
      qualityTier: 'balanced'
    });
    expect(Object.isFrozen(settings)).toBe(true);
  });

  it('creates a new validated settings value when a player changes supported preferences', () => {
    const settings = PlayerSettings.fromData({
      reducedMotion: false,
      uiScale: 'standard',
      qualityTier: 'balanced'
    });

    const updated = settings.withChanges({
      reducedMotion: true,
      uiScale: 'large',
      qualityTier: 'performance'
    });

    expect(updated).not.toBe(settings);
    expect(updated.toJSON()).toEqual({
      reducedMotion: true,
      uiScale: 'large',
      qualityTier: 'performance'
    });
    expect(settings.toJSON()).toEqual({
      reducedMotion: false,
      uiScale: 'standard',
      qualityTier: 'balanced'
    });
  });

  it.each([
    { reducedMotion: 'true', uiScale: 'standard', qualityTier: 'balanced' },
    { reducedMotion: false, uiScale: 'zoomed', qualityTier: 'balanced' },
    { reducedMotion: false, uiScale: 'standard', qualityTier: 'ultra' }
  ])('rejects an unsupported persisted setting value', input => {
    expect(() => PlayerSettings.fromData(input)).toThrow();
  });
});
