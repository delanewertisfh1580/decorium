import { describe, expect, it } from 'vitest';
import { CatalogValidator } from '../../../src/Domain/Items/CatalogValidator.js';

const featureVector = {
  woodShare: 0.5, metalShare: 0.2, glassShare: 0, plasticShare: 0.1,
  textileShare: 0.2, lightColorShare: 0.5, darkColorShare: 0.5, warmPaletteShare: 0.5,
  saturationLevel: 0.4, formSimplicity: 0.7, roundnessShare: 0.4, rectilinearShare: 0.6,
  sizeNorm: 0.4, priceNorm: 0.2, lightingFunctionShare: 0, storageFunctionShare: 0
};

describe('CatalogValidator interaction profiles', () => {
  it('creates semantic Item capabilities from explicit catalog data', () => {
    const [table] = new CatalogValidator().createItems([{
      id: 'table-001', name: 'Dining table', type: 'table', dimensions: { x: 1.8, z: 0.9 },
      price: 500, featureVector,
      interactionProfile: {
        schemaVersion: 1,
        affordances: ['dining-surface'],
        usableSides: ['positiveX', 'negativeX']
      }
    }]);

    expect(table.interactionProfile.toJSON()).toEqual({
      schemaVersion: 1,
      affordances: ['dining-surface'],
      frontAxis: null,
      usableSides: ['positiveX', 'negativeX']
    });
  });

  it('rejects an invalid semantic profile as content invalid instead of silently dropping it', () => {
    expect(() => new CatalogValidator().createItems([{
      id: 'table-001', name: 'Dining table', type: 'table', dimensions: { x: 1.8, z: 0.9 },
      price: 500, featureVector,
      interactionProfile: { schemaVersion: 1, affordances: ['inferred-from-name'] }
    }])).toThrow('InteractionProfile affordance is not supported: inferred-from-name');
  });
});
