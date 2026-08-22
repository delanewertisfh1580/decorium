import { describe, expect, it } from 'vitest';
import { resolveEnvironmentProfilePlan } from '../../src/Presentation/Scene/EnvironmentProfilePlan.js';

const mediaProfile = Object.freeze({
  schemaVersion: 3,
  id: 'urban-media-corner',
  room: Object.freeze({ openingsPreset: 'media-narrow-window', cameraPreset: 'intimate-media', exteriorCompositionPreset: 'urban-cinema-block' }),
  lightingPreset: 'media-dusk',
  exteriorPreset: 'urban-evening',
  sceneLifePreset: 'quiet-media-dusk',
  presentation: Object.freeze({ title: 'Уютный уголок', subtitle: 'Соберите продуманную зону отдыха и просмотра' })
});

describe('V3 exterior composition profile plan', () => {
  it('resolves immutable exterior composition while excluding player-owned wall and built-in identity', () => {
    const plan = resolveEnvironmentProfilePlan(mediaProfile);
    expect(plan.exteriorComposition).toEqual(expect.objectContaining({ kind: 'urban-cinema-block' }));
    expect(Object.isFrozen(plan.exteriorComposition)).toBe(true);
    expect(plan).not.toHaveProperty('identity');
    expect(plan).not.toHaveProperty('hasTelevision');
  });
});
