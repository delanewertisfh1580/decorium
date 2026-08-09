import { describe, it, expect } from 'vitest';
import { RoomVectorCalculator } from '../../../src/Domain/Rooms/RoomVectorCalculator.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';

describe('RoomVectorCalculator', () => {
  const createTestItem = (id, woodShare = 0.5, metalShare = 0.3) => {
    const vector = new FeatureVector({ 
      woodShare, 
      metalShare,
      glassShare: 0.2,
      lightColorShare: 0.6,
      warmPaletteShare: 0.7,
      formSimplicity: 0.5,
      saturationLevel: 0.4,
      plasticShare: 0.1
    });
    return new Item({
      id,
      name: `Test Item ${id}`,
      type: 'furniture',
      featureVector: vector,
      metadata: {}
    });
  };

  it('should calculate zero vector for empty room', () => {
    const emptyState = RoomState.createEmpty();
    const result = RoomVectorCalculator.calculate(emptyState);
    
    // Check that result has the expected properties of a zero vector
    expect(result.woodShare).toBe(0);
    expect(result.metalShare).toBe(0);
    expect(result.glassShare).toBe(0);
    expect(result.lightColorShare).toBe(0);
    expect(result.warmPaletteShare).toBe(0);
    expect(result.formSimplicity).toBe(0);
    expect(result.saturationLevel).toBe(0);
    expect(result.plasticShare).toBe(0);
  });

  it('should calculate average vector for single item', () => {
    const state = RoomState.createEmpty().addItem(createTestItem('item-1', 0.8, 0.2));
    const result = RoomVectorCalculator.calculate(state);
    
    expect(result.woodShare).toBeCloseTo(0.8, 5);
    expect(result.metalShare).toBeCloseTo(0.2, 5);
  });

  it('should calculate average vector for multiple items', () => {
    const state = RoomState.createEmpty()
      .addItem(createTestItem('item-1', 0.6, 0.4))
      .addItem(createTestItem('item-2', 0.8, 0.2));
    
    const result = RoomVectorCalculator.calculate(state);
    
    // Average: wood = (0.6 + 0.8) / 2 = 0.7, metal = (0.4 + 0.2) / 2 = 0.3
    expect(result.woodShare).toBeCloseTo(0.7, 5);
    expect(result.metalShare).toBeCloseTo(0.3, 5);
  });

  it('should handle all 8 dimensions correctly', () => {
    const item1 = new Item({
      id: 'item-1',
      name: 'Item 1',
      type: 'furniture',
      featureVector: new FeatureVector({
        woodShare: 1.0,
        metalShare: 0.0,
        glassShare: 0.0,
        lightColorShare: 1.0,
        warmPaletteShare: 1.0,
        formSimplicity: 0.8,
        saturationLevel: 0.2,
        plasticShare: 0.0
      }),
      metadata: {}
    });

    const item2 = new Item({
      id: 'item-2',
      name: 'Item 2',
      type: 'furniture',
      featureVector: new FeatureVector({
        woodShare: 0.0,
        metalShare: 1.0,
        glassShare: 1.0,
        lightColorShare: 0.0,
        warmPaletteShare: 0.0,
        formSimplicity: 0.4,
        saturationLevel: 0.8,
        plasticShare: 1.0
      }),
      metadata: {}
    });

    const state = RoomState.createEmpty().addItem(item1).addItem(item2);
    const result = RoomVectorCalculator.calculate(state);

    expect(result.woodShare).toBeCloseTo(0.5, 5);
    expect(result.metalShare).toBeCloseTo(0.5, 5);
    expect(result.glassShare).toBeCloseTo(0.5, 5);
    expect(result.lightColorShare).toBeCloseTo(0.5, 5);
    expect(result.warmPaletteShare).toBeCloseTo(0.5, 5);
    expect(result.formSimplicity).toBeCloseTo(0.6, 5);
    expect(result.saturationLevel).toBeCloseTo(0.5, 5);
    expect(result.plasticShare).toBeCloseTo(0.5, 5);
  });

  it('should not mutate the original room state', () => {
    const state = RoomState.createEmpty().addItem(createTestItem('item-1', 0.9));
    const beforeCount = state.getItemCount();
    
    RoomVectorCalculator.calculate(state);
    
    expect(state.getItemCount()).toBe(beforeCount);
  });
});
