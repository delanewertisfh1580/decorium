import { describe, it, expect } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';

describe('Item Entity', () => {
  const validVector = new FeatureVector({ 
    woodShare: 0.8, 
    metalShare: 0.2,
    glassShare: 0.1,
    lightColorShare: 0.7,
    warmPaletteShare: 0.6,
    formSimplicity: 0.5,
    saturationLevel: 0.3,
    plasticShare: 0.05
  });
  const validMetadata = { width: 1.0, height: 1.5, depth: 0.5 };

  it('should create a valid item with required fields', () => {
    const item = new Item({
      id: 'chair-001',
      name: 'Scandinavian Chair',
      type: 'chair',
      featureVector: validVector,
      metadata: validMetadata
    });

    expect(item.id).toBe('chair-001');
    expect(item.name).toBe('Scandinavian Chair');
    expect(item.type).toBe('chair');
    expect(item.featureVector).toBe(validVector);
    expect(item.metadata).toEqual(validMetadata);
  });

  it('should create an item without optional metadata', () => {
    const item = new Item({
      id: 'table-001',
      name: 'Wooden Table',
      type: 'table',
      featureVector: validVector
    });

    expect(item.id).toBe('table-001');
    expect(item.metadata).toBeUndefined();
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
