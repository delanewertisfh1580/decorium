import { describe, expect, it } from 'vitest';
import { resolveEnvironmentProfilePlan } from '../../src/Presentation/Scene/EnvironmentProfilePlan.js';

const mediaProfile = Object.freeze({
  schemaVersion: 2,
  id: 'urban-media-corner',
  label: 'Городской медиа-уголок',
  room: Object.freeze({
    floorPreset: 'dark-oak',
    wallPreset: 'charcoal-accent',
    openingsPreset: 'media-narrow-window',
    cameraPreset: 'intimate-media',
    identity: Object.freeze({
      wallTreatmentPreset: 'midnight-graphic-wallpaper',
      builtInPreset: 'media-wall-screen',
      exteriorCompositionPreset: 'urban-cinema-block'
    })
  }),
  lightingPreset: 'media-dusk',
  exteriorPreset: 'urban-evening',
  ambientFixtures: Object.freeze(['accent-wall-art', 'low-bookshelf']),
  sceneLifePreset: 'quiet-media-dusk',
  presentation: Object.freeze({ title: 'Уютный уголок', subtitle: 'Соберите продуманную зону отдыха и просмотра' })
});

describe('PROD-016 room identity profile plan', () => {
  it('resolves immutable profile-owned wall, built-in and exterior composition presets for the scene layer', () => {
    const plan = resolveEnvironmentProfilePlan(mediaProfile);

    expect(plan.identity).toEqual({
      wallTreatment: expect.objectContaining({ kind: 'midnight-graphic-wallpaper' }),
      builtIn: expect.objectContaining({ kind: 'media-wall-screen', semantic: false }),
      exteriorComposition: expect.objectContaining({ kind: 'urban-cinema-block' })
    });
    expect(Object.isFrozen(plan.identity)).toBe(true);
    expect(plan.hasTelevision).toBe(false);
  });
});
