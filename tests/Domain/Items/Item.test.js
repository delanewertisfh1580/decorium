import { describe, it, expect } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';

describe('Item Entity', () => {
  const validVector = new FeatureVector({ 
    woodShare: 0.8, 
    metalShare: 0.2,
    glassShare: 0.1,
    plasticShare: 0.05,
    textileShare: 0.3,
    lightColorShare: 0.7,
    darkColorShare: 0.3,
    warmPaletteShare: 0.6,
    saturationLevel: 0.3,
    formSimplicity: 0.5,
    roundnessShare: 0.4,
    rectilinearShare: 0.6,
    sizeNorm: 0.5,
    priceNorm: 0.4,
    lightingFunctionShare: 0.0,
    storageFunctionShare: 0.2
  });
  const validDimensions = { x: 1.0, z: 0.5, height: 1.5 };

  it('should create a valid item with required fields', () => {
    const item = new Item({
      id: 'chair-001',
      name: 'Scandinavian Chair',
      type: 'chair',
      featureVector: validVector,
      dimensions: validDimensions,
      price: 150
    });

    expect(item.id).toBe('chair-001');
    expect(item.name).toBe('Scandinavian Chair');
    expect(item.type).toBe('chair');
    expect(item.featureVector).toBe(validVector);
    expect(item.dimensions).toEqual(validDimensions);
    expect(item.price).toBe(150);
  });

  it('should create an item without optional dimensions and price', () => {
    const item = new Item({
      id: 'table-001',
      name: 'Wooden Table',
      type: 'table',
      featureVector: validVector
    });

    expect(item.id).toBe('table-001');
    expect(item.dimensions).toBeUndefined();
    expect(item.price).toBe(0);
  });

  it('should throw error if id is missing', () => {
    expect(() => {
      new Item({
        name: 'Invalid Item',
        type: 'decor',
        featureVector: validVector
      });
    }).toThrow('Item ID is required');
  });

  it('should throw error if id is empty string', () => {
    expect(() => {
      new Item({
        id: '',
        name: 'Invalid Item',
        type: 'decor',
        featureVector: validVector
      });
    }).toThrow('Item ID cannot be empty');
  });

  it('should throw error if name is missing', () => {
    expect(() => {
      new Item({
        id: 'item-001',
        type: 'decor',
        featureVector: validVector
      });
    }).toThrow('Item name is required');
  });

  it('should throw error if type is missing', () => {
    expect(() => {
      new Item({
        id: 'item-001',
        name: 'Valid Name',
        featureVector: validVector
      });
    }).toThrow('Item type is required');
  });

  it('should throw error if featureVector is missing', () => {
    expect(() => {
      new Item({
        id: 'item-001',
        name: 'Valid Name',
        type: 'decor'
      });
    }).toThrow('Item featureVector is required');
  });

  it('should throw error if featureVector is not a FeatureVector instance', () => {
    expect(() => {
      new Item({
        id: 'item-001',
        name: 'Valid Name',
        type: 'decor',
        featureVector: { wood_share: 0.5 } // Plain object, not FeatureVector
      });
    }).toThrow('featureVector must be an instance of FeatureVector');
  });

  it('should be immutable (properties cannot be changed after creation)', () => {
    const item = new Item({
      id: 'lamp-001',
      name: 'Floor Lamp',
      type: 'lighting',
      featureVector: validVector
    });

    // Private fields and Object.freeze ensure immutability
    // Attempting to set a property should fail
    expect(() => {
      item.id = 'hacked-id';
    }).toThrow();
  });
});
