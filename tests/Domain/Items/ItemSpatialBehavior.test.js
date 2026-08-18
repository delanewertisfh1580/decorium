import { describe, expect, it } from 'vitest';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

const featureVector = new FeatureVector({
  woodShare: 0.5,
  metalShare: 0.1,
  glassShare: 0,
  plasticShare: 0,
  textileShare: 0.4,
  lightColorShare: 0.8,
  darkColorShare: 0.2,
  warmPaletteShare: 0.7,
  saturationLevel: 0.2,
  formSimplicity: 0.8,
  roundnessShare: 0.2,
  rectilinearShare: 0.8,
  sizeNorm: 0.3,
  priceNorm: 0.3,
  lightingFunctionShare: 0,
  storageFunctionShare: 0
});

describe('Item spatial behavior', () => {
  it('retains an authored immutable SpatialBehavior independently of name, type and visual representation', () => {
    const spatialBehavior = new SpatialBehavior({
      schemaVersion: 1,
      placementKind: 'floor-overlay',
      occupancyMode: 'ignored',
      clearanceMode: 'ignored',
      supportMode: 'none'
    });
    const item = new Item({
      id: 'rug-001',
      name: 'Ковер большой',
      type: 'decor',
      dimensions: { x: 2, z: 1.5 },
      price: 100,
      featureVector,
      spatialBehavior
    });

    expect(item.spatialBehavior).toBe(spatialBehavior);
    expect(item.spatialBehavior.isFloorObstacle).toBe(false);
    expect(Object.isFrozen(item)).toBe(true);
  });
});
