import { describe, expect, it } from 'vitest';
import { LOCATION_LIFE_CONFIG, validateLocationLifeConfig } from '../../src/Presentation/Scene/locationLifeConfig.js';

describe('UI-ROOM-002 living location contract', () => {
  it('defines a street, facade and deterministic crossing routes', () => {
    expect(LOCATION_LIFE_CONFIG.environment).toEqual(['facade', 'sidewalk', 'road']);
    expect(LOCATION_LIFE_CONFIG.routes.map(route => route.kind)).toEqual([
      'pedestrian', 'pedestrian', 'car', 'car', 'animal'
    ]);
    expect(LOCATION_LIFE_CONFIG.routes.every(route => (
      route.start < 0 && route.end > 1 && route.speed > 0 && Number.isFinite(route.phase)
    ))).toBe(true);
  });

  it('keeps interior life separate from gameplay state', () => {
    expect(LOCATION_LIFE_CONFIG.interior).toEqual({
      details: ['wall-art', 'books', 'mug', 'pet-bed', 'pet-bowls'],
      pets: ['wandering-dog', 'resting-cat']
    });
  });

  it('rejects incomplete or nondeterministic route contracts', () => {
    expect(validateLocationLifeConfig(LOCATION_LIFE_CONFIG)).toEqual([]);
    expect(validateLocationLifeConfig({ routes: [] })).toContain('routes');
    expect(validateLocationLifeConfig({
      ...LOCATION_LIFE_CONFIG,
      routes: [{ kind: 'car', start: 0, end: 1, speed: 0, phase: Number.NaN }]
    })).toContain('routes');
  });
});
