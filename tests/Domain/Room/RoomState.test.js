import { describe, it, expect } from 'vitest';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';

describe('RoomState', () => {
  const createTestItem = (id, xSize = 1, zSize = 1) => {
    const vector = new FeatureVector({
      woodShare: 0.5,
      metalShare: 0.5,
      glassShare: 0.5,
      plasticShare: 0.5,
      textileShare: 0.5,
      lightColorShare: 0.5,
      darkColorShare: 0.5,
      warmPaletteShare: 0.5,
      saturationLevel: 0.5,
      formSimplicity: 0.5,
      roundnessShare: 0.5,
      rectilinearShare: 0.5,
      sizeNorm: 0.5,
      priceNorm: 0.5,
      lightingFunctionShare: 0.5,
      storageFunctionShare: 0.5
    });
    return new Item({
      id,
      name: 'Test Chair',
      type: 'chair',
      featureVector: vector,
      dimensions: { x: xSize, z: zSize },
      price: 100
    });
  };

  const createBounds = (width = 5, depth = 5) => {
    return new RoomBounds(width, depth, [], []);
  };

  it('should create empty room state', () => {
    const bounds = createBounds();
    const state = new RoomState(bounds);
    expect(state.getItems()).toHaveLength(0);
  });

  it('should place item successfully within bounds', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    // Позиция 2.5 в комнате 5x5 с предметом 1x1: края от 2.0 до 3.0 - в пределах
    const result = state.placeItem(item, { x: 2.5, z: 2.5 }, 0);
    
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(state.getItems()).toHaveLength(1);
  });

  it('should reject placement outside room bounds', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    // Позиция 4.5 + половина размера 0.5 = 5.0 (ровно граница), но 4.5 + 0.5 = 5.0 OK
    // Попробуем 4.8: 4.8 + 0.5 = 5.3 > 5.0 - выход за границу
    const result = state.placeItem(item, { x: 4.8, z: 2.5 }, 0);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('OUT_OF_BOUNDS');
    expect(state.getItems()).toHaveLength(0);
  });

  it('should reject placement overlapping with existing item', () => {
    const bounds = createBounds(10, 10);
    const state = new RoomState(bounds);
    const item1 = createTestItem('item-1', 1, 1);
    const item2 = createTestItem('item-2', 1, 1);

    state.placeItem(item1, { x: 2.5, z: 2.5 }, 0);
    // Слишком близко - пересечение
    const result = state.placeItem(item2, { x: 2.6, z: 2.5 }, 0);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('COLLISION');
    expect(state.getItems()).toHaveLength(1);
  });

  it('should allow placement with sufficient gap (0.9m)', () => {
    const bounds = createBounds(10, 10);
    const state = new RoomState(bounds);
    const item1 = createTestItem('item-1', 1, 1);
    const item2 = createTestItem('item-2', 1, 1);

    state.placeItem(item1, { x: 2.5, z: 2.5 }, 0);
    // Расстояние между центрами 3.0: края 3.0 и 2.0, зазор = 1.0м > 0.9м
    const result = state.placeItem(item2, { x: 5.5, z: 5.5 }, 0);
    
    expect(result.success).toBe(true);
  });

  it('should reject placement with insufficient gap (<0.9m)', () => {
    const bounds = createBounds(10, 10);
    const state = new RoomState(bounds);
    const item1 = createTestItem('item-1', 1, 1);
    const item2 = createTestItem('item-2', 1, 1);

    state.placeItem(item1, { x: 2.5, z: 2.5 }, 0);
    // Расстояние между центрами 1.5: края 3.0 и 2.0, зазор = 0.5м < 0.9м
    const result = state.placeItem(item2, { x: 3.5, z: 3.5 }, 0);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('INSUFFICIENT_GAP');
  });

  it('should move item successfully', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    state.placeItem(item, { x: 2.5, z: 2.5 }, 0);
    const result = state.moveItem('item-1', { x: 3.5, z: 3.5 });
    
    expect(result.success).toBe(true);
    const items = state.getItems();
    expect(items[0].position).toEqual({ x: 3.5, z: 3.5 });
  });

  it('should reject move if new position is invalid', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    state.placeItem(item, { x: 2.5, z: 2.5 }, 0);
    const result = state.moveItem('item-1', { x: 10, z: 10 }); // За границей
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('OUT_OF_BOUNDS');
  });

  it('should rotate item by 90 degrees', () => {
    const bounds = createBounds(10, 10);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 2); // Прямоугольный предмет

    state.placeItem(item, { x: 5, z: 5 }, 0);
    const result = state.rotateItem('item-1');
    
    expect(result.success).toBe(true);
    const items = state.getItems();
    expect(items[0].rotation).toBe(90);
  });

  it('should remove item successfully', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    state.placeItem(item, { x: 2.5, z: 2.5 }, 0);
    const result = state.removeItem('item-1');
    
    expect(result.success).toBe(true);
    expect(state.getItems()).toHaveLength(0);
  });

  it('should return error when removing non-existent item', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    
    const result = state.removeItem('non-existent');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('NOT_FOUND');
  });

  it('should serialize and deserialize state', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    state.placeItem(item, { x: 2.5, z: 2.5 }, 0);
    
    const snapshot = state.serialize();
    const itemCatalog = new Map([['item-1', item]]);
    const restored = RoomState.deserialize(snapshot, bounds, itemCatalog);
    
    expect(restored.getItems()).toHaveLength(1);
    expect(restored.getItems()[0].id).toBe('item-1');
    expect(restored.getItems()[0].position).toEqual({ x: 2.5, z: 2.5 });
  });
});
