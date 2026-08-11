import { describe, it, expect } from 'vitest';
import { FeatureVector, REQUIRED_FIELDS_COUNT } from '../../../src/Domain/Items/FeatureVector.js';
import { CatalogValidator } from '../../../src/Domain/Items/CatalogValidator.js';

describe('FeatureVector v2', () => {
  it('должен требовать ровно 16 полей', () => {
    expect(REQUIRED_FIELDS_COUNT).toBe(16);
    expect(FeatureVector.REQUIRED_FIELDS.length).toBe(16);
  });

  it('должен принимать валидный вектор со всеми 16 полями 0..1', () => {
    const validData = {
      woodShare: 0.5, metalShare: 0.3, glassShare: 0.2, plasticShare: 0.1,
      textileShare: 0.4, lightColorShare: 0.6, darkColorShare: 0.4, warmPaletteShare: 0.7,
      saturationLevel: 0.5, formSimplicity: 0.8, roundnessShare: 0.3, rectilinearShare: 0.7,
      sizeNorm: 0.5, priceNorm: 0.6, lightingFunctionShare: 0.2, storageFunctionShare: 0.4
    };
    const vector = new FeatureVector(validData);
    expect(vector.woodShare).toBe(0.5);
    expect(vector.storageFunctionShare).toBe(0.4);
    expect(vector.priceNorm).toBe(0.6);
  });

  it('должен отклонять вектор с missing полями', () => {
    const incompleteData = { woodShare: 0.5, metalShare: 0.3 };
    expect(() => new FeatureVector(incompleteData)).toThrow('Missing required field');
  });

  it('должен отклонять вектор со значениями вне 0..1', () => {
    const invalidData = {
      woodShare: 1.5, metalShare: 0.3, glassShare: 0.2, plasticShare: 0.1,
      textileShare: 0.4, lightColorShare: 0.6, darkColorShare: 0.4, warmPaletteShare: 0.7,
      saturationLevel: 0.5, formSimplicity: 0.8, roundnessShare: 0.3, rectilinearShare: 0.7,
      sizeNorm: 0.5, priceNorm: 0.6, lightingFunctionShare: 0.2, storageFunctionShare: 0.4
    };
    expect(() => new FeatureVector(invalidData)).toThrow('must be between 0 and 1');
  });
});

describe('CatalogValidator', () => {
  const createValidItemData = (id, index = 0) => ({
    id,
    name: `Item ${index}`,
    type: 'furniture',
    dimensions: { x: 1, z: 1 },
    price: 100,
    featureVector: {
      woodShare: 0.5, metalShare: 0.3, glassShare: 0.2, plasticShare: 0.1,
      textileShare: 0.4, lightColorShare: 0.6, darkColorShare: 0.4, warmPaletteShare: 0.7,
      saturationLevel: 0.5, formSimplicity: 0.8, roundnessShare: 0.3, rectilinearShare: 0.7,
      sizeNorm: 0.5, priceNorm: 0.6, lightingFunctionShare: 0.2, storageFunctionShare: 0.4
    }
  });

  it('должен принимать валидный каталог из 30+ предметов', () => {
    const items = [];
    for (let i = 0; i < 30; i++) {
      items.push(createValidItemData(`item-${i}`, i));
    }
    const validator = new CatalogValidator();
    expect(() => validator.validate(items)).not.toThrow();
  });

  it('должен отклонять каталог с дубликатами id', () => {
    const items = [
      createValidItemData('item-1', 1),
      createValidItemData('item-1', 2)
    ];
    const validator = new CatalogValidator();
    expect(() => validator.validate(items)).toThrow('Duplicate item id');
  });

  it('должен отклонять предмет без dimensions', () => {
    const items = [{
      id: 'item-1',
      name: 'Item 1',
      type: 'furniture',
      price: 100,
      featureVector: {
        woodShare: 0.5, metalShare: 0.3, glassShare: 0.2, plasticShare: 0.1,
        textileShare: 0.4, lightColorShare: 0.6, darkColorShare: 0.4, warmPaletteShare: 0.7,
        saturationLevel: 0.5, formSimplicity: 0.8, roundnessShare: 0.3, rectilinearShare: 0.7,
        sizeNorm: 0.5, priceNorm: 0.6, lightingFunctionShare: 0.2, storageFunctionShare: 0.4
      }
    }];
    const validator = new CatalogValidator();
    expect(() => validator.validate(items)).toThrow('invalid or missing dimensions');
  });

  it('должен создавать Item экземпляры из валидных данных', () => {
    const itemsData = [createValidItemData('item-1', 1)];
    const validator = new CatalogValidator();
    const items = validator.createItems(itemsData);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('item-1');
    expect(items[0].dimensions).toEqual({ x: 1, z: 1 });
    expect(items[0].price).toBe(100);
  });
});
