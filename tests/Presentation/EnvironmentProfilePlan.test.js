import { describe, expect, it } from 'vitest';
import { resolveEnvironmentProfilePlan } from '../../src/Presentation/Scene/EnvironmentProfilePlan.js';

const warmProfile = Object.freeze({
  schemaVersion: 3,
  id: 'warm-starter-living',
  room: Object.freeze({ openingsPreset: 'living-window-and-door', cameraPreset: 'compact-living', exteriorCompositionPreset: 'residential-porch' }),
  lightingPreset: 'warm-evening',
  exteriorPreset: 'quiet-residential-street',
  sceneLifePreset: 'calm-indoor-evening',
  presentation: Object.freeze({ title: 'Гостиная', subtitle: 'Первые шаги' })
});
const mediaProfile = Object.freeze({ ...warmProfile, id: 'urban-media-corner', room: Object.freeze({ openingsPreset: 'media-narrow-window', cameraPreset: 'intimate-media', exteriorCompositionPreset: 'urban-cinema-block' }), lightingPreset: 'media-dusk', exteriorPreset: 'urban-evening', sceneLifePreset: 'quiet-media-dusk' });
const studioProfile = Object.freeze({ ...warmProfile, id: 'bright-studio', room: Object.freeze({ openingsPreset: 'studio-wide-window', cameraPreset: 'open-studio', exteriorCompositionPreset: 'courtyard-workshop' }), lightingPreset: 'bright-daylight', exteriorPreset: 'courtyard-daylight', sceneLifePreset: 'studio-daylight' });

describe('resolveEnvironmentProfilePlan', () => {
  it('creates a frozen deterministic shell, exterior and atmosphere plan from V3 authored presets', () => {
    const plan = resolveEnvironmentProfilePlan(warmProfile);
    expect(plan.id).toBe('warm-starter-living');
    expect(plan.openings.window.widthFactor).toBe(0.34);
    expect(plan.camera.targetHeight).toBe(0.8);
    expect(plan.lighting.background).toBe(0x172131);
    expect(plan.exterior.kind).toBe('quiet-residential-street');
    expect(plan.exteriorComposition.kind).toBe('residential-porch');
    expect(plan).not.toHaveProperty('surfaces');
    expect(plan).not.toHaveProperty('fixtures');
    expect(Object.isFrozen(plan)).toBe(true);
  });

  it('changes structural/exterior presentation decisions without creating interior ownership', () => {
    const warmPlan = resolveEnvironmentProfilePlan(warmProfile);
    const studioPlan = resolveEnvironmentProfilePlan(studioProfile);
    expect(studioPlan.openings.window.widthFactor).toBeGreaterThan(warmPlan.openings.window.widthFactor);
    expect(studioPlan.lighting.background).not.toBe(warmPlan.lighting.background);
    expect(studioPlan.exterior.kind).toBe('courtyard-daylight');
    expect(studioPlan.exteriorComposition.kind).toBe('courtyard-workshop');
  });

  it('keeps media atmosphere distinct without embedding a television or other player interior', () => {
    const warmPlan = resolveEnvironmentProfilePlan(warmProfile);
    const mediaPlan = resolveEnvironmentProfilePlan(mediaProfile);
    expect(mediaPlan.lighting.background).not.toBe(warmPlan.lighting.background);
    expect(mediaPlan.lighting.hemisphereIntensity).toBeGreaterThanOrEqual(1.8);
    expect(JSON.stringify(mediaPlan)).not.toContain('television');
  });

  it('rejects incomplete authored profiles instead of inventing a scene fallback', () => {
    expect(() => resolveEnvironmentProfilePlan({ id: 'broken' })).toThrow('Presentation environment profile is incomplete.');
  });
});
