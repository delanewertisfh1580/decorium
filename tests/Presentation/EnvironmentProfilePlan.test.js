import { describe, expect, it } from 'vitest';
import { resolveEnvironmentProfilePlan } from '../../src/Presentation/Scene/EnvironmentProfilePlan.js';

const warmProfile = Object.freeze({
  schemaVersion: 2,
  id: 'warm-starter-living',
  room: Object.freeze({
    floorPreset: 'light-oak',
    wallPreset: 'warm-plaster',
    openingsPreset: 'living-window-and-door',
    cameraPreset: 'compact-living',
    identity: Object.freeze({ wallTreatmentPreset: 'warm-linen-wainscot', builtInPreset: 'living-library-nook', exteriorCompositionPreset: 'residential-porch' })
  }),
  lightingPreset: 'warm-evening',
  exteriorPreset: 'quiet-residential-street',
  ambientFixtures: Object.freeze(['mirror', 'bookshelf', 'resting-cat']),
  sceneLifePreset: 'calm-indoor-evening',
  presentation: Object.freeze({ title: 'Гостиная', subtitle: 'Первые шаги' })
});

const mediaProfile = Object.freeze({
  ...warmProfile,
  id: 'urban-media-corner',
  room: Object.freeze({
    floorPreset: 'dark-oak',
    wallPreset: 'charcoal-accent',
    openingsPreset: 'media-narrow-window',
    cameraPreset: 'intimate-media',
    identity: Object.freeze({ wallTreatmentPreset: 'midnight-graphic-wallpaper', builtInPreset: 'media-wall-screen', exteriorCompositionPreset: 'urban-cinema-block' })
  }),
  lightingPreset: 'media-dusk',
  exteriorPreset: 'urban-evening',
  ambientFixtures: Object.freeze(['low-bookshelf']),
  sceneLifePreset: 'quiet-media-dusk',
  presentation: Object.freeze({ title: 'Медиа-уголок', subtitle: 'Уютный просмотр' })
});

const studioProfile = Object.freeze({
  ...warmProfile,
  id: 'bright-studio',
  room: Object.freeze({
    floorPreset: 'concrete-sand',
    wallPreset: 'gallery-white',
    openingsPreset: 'studio-wide-window',
    cameraPreset: 'open-studio',
    identity: Object.freeze({ wallTreatmentPreset: 'sunwash-gallery-wall', builtInPreset: 'studio-gallery-rail', exteriorCompositionPreset: 'courtyard-workshop' })
  }),
  lightingPreset: 'bright-daylight',
  exteriorPreset: 'courtyard-daylight',
  ambientFixtures: Object.freeze(['studio-planter', 'gallery-shelf']),
  sceneLifePreset: 'studio-daylight',
  presentation: Object.freeze({ title: 'Студия', subtitle: 'Открытое пространство' })
});

describe('resolveEnvironmentProfilePlan', () => {
  it('creates a frozen deterministic scene plan from authored preset vocabulary', () => {
    const plan = resolveEnvironmentProfilePlan(warmProfile);

    expect(plan.id).toBe('warm-starter-living');
    expect(plan.surfaces.floor.color).toBe(0xbca18b);
    expect(plan.surfaces.wall.color).toBe(0x4a5965);
    expect(plan.openings.window.widthFactor).toBe(0.34);
    expect(plan.camera.targetHeight).toBe(0.8);
    expect(plan.lighting.background).toBe(0x172131);
    expect(plan.exterior.kind).toBe('quiet-residential-street');
    expect(plan.fixtures).toEqual(['mirror', 'bookshelf', 'resting-cat']);
    expect(plan.hasTelevision).toBe(false);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.surfaces)).toBe(true);
  });

  it('changes physical scene decisions when a different authored profile is selected', () => {
    const warmPlan = resolveEnvironmentProfilePlan(warmProfile);
    const studioPlan = resolveEnvironmentProfilePlan(studioProfile);

    expect(studioPlan.surfaces.floor.color).not.toBe(warmPlan.surfaces.floor.color);
    expect(studioPlan.openings.window.widthFactor).toBeGreaterThan(warmPlan.openings.window.widthFactor);
    expect(studioPlan.lighting.background).not.toBe(warmPlan.lighting.background);
    expect(studioPlan.exterior.kind).toBe('courtyard-daylight');
    expect(studioPlan.fixtures).toEqual(['studio-planter', 'gallery-shelf']);
  });

  it('keeps the authored media-dusk scene readable while remaining visibly darker than the starter profile', () => {
    const warmPlan = resolveEnvironmentProfilePlan(warmProfile);
    const mediaPlan = resolveEnvironmentProfilePlan(mediaProfile);

    expect(mediaPlan.lighting.background).not.toBe(warmPlan.lighting.background);
    expect(mediaPlan.lighting.hemisphereIntensity).toBeGreaterThanOrEqual(1.8);
    expect(mediaPlan.lighting.keyIntensity).toBeGreaterThanOrEqual(2.8);
    expect(mediaPlan.lighting.warmIntensity).toBeGreaterThanOrEqual(5);
  });

  it('rejects incomplete authored profiles instead of inventing a scene fallback', () => {
    expect(() => resolveEnvironmentProfilePlan({ id: 'broken' })).toThrow('Presentation environment profile is incomplete.');
  });
});
