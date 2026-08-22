import { describe, expect, it } from 'vitest';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';
import Item from '../../../src/Domain/Items/Item.js';

const featureVector = new FeatureVector({
  woodShare: 0.5, metalShare: 0.2, glassShare: 0, plasticShare: 0.1,
  textileShare: 0.2, lightColorShare: 0.5, darkColorShare: 0.5, warmPaletteShare: 0.5,
  saturationLevel: 0.4, formSimplicity: 0.7, roundnessShare: 0.4, rectilinearShare: 0.6,
  sizeNorm: 0.4, priceNorm: 0.2, lightingFunctionShare: 0, storageFunctionShare: 0
});

describe('Item interaction profile', () => {
  it('exposes immutable semantic capabilities for functional-layout evaluators', () => {
    const interactionProfile = new InteractionProfile({
      schemaVersion: 1,
      affordances: ['dining-surface'],
      usableSides: ['positiveX', 'negativeX']
    });
    const item = new Item({
      id: 'table-001', name: 'Dining table', type: 'table', featureVector,
      dimensions: { x: 1.8, z: 0.9 }, interactionProfile,
      spatialBehavior: new SpatialBehavior({
        schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
      })
    });

    expect(item.interactionProfile).toBe(interactionProfile);
    expect(item.interactionProfile.hasAffordance('dining-surface')).toBe(true);
  });

  it('rejects construction without an authored interaction profile', () => {
    expect(() => new Item({
      id: 'decor-001', name: 'Vase', type: 'decor', featureVector,
      dimensions: { x: 0.3, z: 0.3 }
    })).toThrow('Item interactionProfile must be an instance of InteractionProfile');
  });
});
