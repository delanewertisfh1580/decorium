import { describe, it, expect } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

describe('Item Entity', () => {
  const validVector = new FeatureVector({
    woodShare: 0.8, metalShare: 0.2, glassShare: 0.1, plasticShare: 0.05, textileShare: 0.3,
    lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.6, saturationLevel: 0.3,
    formSimplicity: 0.5, roundnessShare: 0.4, rectilinearShare: 0.6, sizeNorm: 0.5,
    priceNorm: 0.4, lightingFunctionShare: 0, storageFunctionShare: 0.2
  });
  const validDimensions = { x: 1, z: 0.5, height: 1.5 };
  const validInteractionProfile = new InteractionProfile({
    schemaVersion: 1, affordances: ['lounge-seat'], frontAxis: 'positiveZ', usableSides: ['positiveX', 'negativeX']
  });
  const validSpatialBehavior = new SpatialBehavior({
    schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
  });
  const validItemData = {
    id: 'chair-001', name: 'Scandinavian Chair', type: 'chair', featureVector: validVector,
    dimensions: validDimensions, price: 150, interactionProfile: validInteractionProfile, spatialBehavior: validSpatialBehavior
  };

  it('creates a valid item only with explicit authored semantic contracts', () => {
    const item = new Item(validItemData);

    expect(item.id).toBe('chair-001');
    expect(item.name).toBe('Scandinavian Chair');
    expect(item.type).toBe('chair');
    expect(item.featureVector).toBe(validVector);
    expect(item.dimensions).toEqual(validDimensions);
    expect(item.price).toBe(150);
    expect(item.interactionProfile).toBe(validInteractionProfile);
    expect(item.spatialBehavior).toBe(validSpatialBehavior);
  });

  it('allows optional dimensions and price without making semantic contracts optional', () => {
    const item = new Item({
      ...validItemData, id: 'table-001', name: 'Wooden Table', type: 'table', dimensions: undefined, price: undefined
    });

    expect(item.id).toBe('table-001');
    expect(item.dimensions).toBeUndefined();
    expect(item.price).toBe(0);
  });

  it('rejects missing authored interaction and spatial semantics', () => {
    expect(() => new Item({ ...validItemData, interactionProfile: undefined }))
      .toThrow('Item interactionProfile must be an instance of InteractionProfile');
    expect(() => new Item({ ...validItemData, spatialBehavior: undefined }))
      .toThrow('Item spatialBehavior must be an instance of SpatialBehavior');
  });

  it('throws error if ID, name, type or feature vector is invalid', () => {
    expect(() => new Item({ ...validItemData, id: undefined })).toThrow('Item ID is required');
    expect(() => new Item({ ...validItemData, id: '' })).toThrow('Item ID cannot be empty');
    expect(() => new Item({ ...validItemData, name: undefined })).toThrow('Item name is required');
    expect(() => new Item({ ...validItemData, type: undefined })).toThrow('Item type is required');
    expect(() => new Item({ ...validItemData, featureVector: undefined })).toThrow('Item featureVector is required');
    expect(() => new Item({ ...validItemData, featureVector: { woodShare: 0.5 } }))
      .toThrow('featureVector must be an instance of FeatureVector');
  });

  it('is immutable after creation', () => {
    const item = new Item(validItemData);

    expect(() => { item.id = 'hacked-id'; }).toThrow();
  });
});
