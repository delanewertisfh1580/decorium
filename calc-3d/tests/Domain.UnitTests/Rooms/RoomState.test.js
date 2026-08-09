import { describe, it, expect } from 'vitest';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';

describe('RoomState', () => {
  const createTestItem = (id, woodShare = 0.5) => {
    const vector = new FeatureVector({ 
      woodShare,
      metalShare: 0.3,
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

  it('should create an empty room state', () => {
    const state = RoomState.createEmpty();
    expect(state.getItems()).toEqual([]);
    expect(state.getItemCount()).toBe(0);
  });

  it('should add an item to the room and return new state', () => {
    const initialState = RoomState.createEmpty();
    const item = createTestItem('item-1', 0.8);
    
    const newState = initialState.addItem(item);
    
    // Immutable check: original state should not change
    expect(initialState.getItemCount()).toBe(0);
    expect(newState.getItemCount()).toBe(1);
    expect(newState.getItems()[0].id).toBe('item-1');
  });

  it('should remove an item from the room by ID and return new state', () => {
    const initialState = RoomState.createEmpty();
    const item1 = createTestItem('item-1', 0.8);
    const item2 = createTestItem('item-2', 0.6);
    
    const withItems = initialState.addItem(item1).addItem(item2);
    expect(withItems.getItemCount()).toBe(2);
    
    const newState = withItems.removeItem('item-1');
    
    // Immutable check
    expect(withItems.getItemCount()).toBe(2);
    expect(newState.getItemCount()).toBe(1);
    expect(newState.getItems()[0].id).toBe('item-2');
  });

  it('should throw error when removing non-existent item', () => {
    const state = RoomState.createEmpty();
    expect(() => state.removeItem('non-existent')).toThrow('Item with ID non-existent not found');
  });

  it('should prevent duplicate item IDs', () => {
    const initialState = RoomState.createEmpty();
    const item = createTestItem('item-1', 0.8);
    
    const withOne = initialState.addItem(item);
    expect(() => withOne.addItem(item)).toThrow('Item with ID item-1 already exists');
  });
});
