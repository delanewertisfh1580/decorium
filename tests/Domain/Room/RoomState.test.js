import { describe, it, expect } from 'vitest';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

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
      price: 100,
      interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: ['lounge-seat'] }),
      spatialBehavior: new SpatialBehavior({
        schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
      })
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

  it('should allow placement overlapping with existing item', () => {
    const bounds = createBounds(10, 10);
    const state = new RoomState(bounds);
    const item1 = createTestItem('item-1', 1, 1);
    const item2 = createTestItem('item-2', 1, 1);

    state.placeItem(item1, { x: 2.5, z: 2.5 }, 0);
    const result = state.placeItem(item2, { x: 2.6, z: 2.5 }, 0);

    expect(result.success).toBe(true);
    expect(state.getItems()).toHaveLength(2);
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

  it('should allow placement with any gap', () => {
    const bounds = createBounds(10, 10);
    const state = new RoomState(bounds);
    const item1 = createTestItem('item-1', 1, 1);
    const item2 = createTestItem('item-2', 1, 1);

    state.placeItem(item1, { x: 2.5, z: 2.5 }, 0);
    const result = state.placeItem(item2, { x: 3.5, z: 3.5 }, 0);

    expect(result.success).toBe(true);
  });

  it('should preview placement without mutating room state', () => {
    const state = new RoomState(createBounds(5, 5));
    const item = createTestItem('item-1', 1, 1);

    const result = state.validatePlacement(item, { x: 2.5, z: 2.5 });

    expect(result.success).toBe(true);
    expect(state.getItems()).toHaveLength(0);
  });

  it('should preview move against domain rules', () => {
    const state = new RoomState(createBounds(5, 5));
    const item = createTestItem('item-1', 1, 1);
    state.placeItem(item, { x: 2.5, z: 2.5 });

    const result = state.validateMove('item-1#1', { x: 10, z: 10 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('OUT_OF_BOUNDS');
    expect(state.getItems()[0].position).toEqual({ x: 2.5, y: 0, z: 2.5 });
  });

  it('should move item successfully', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    state.placeItem(item, { x: 2.5, z: 2.5 }, 0);
    const result = state.moveItem('item-1#1', { x: 3.5, z: 3.5 });
    
    expect(result.success).toBe(true);
    const items = state.getItems();
    expect(items[0].position).toEqual({ x: 3.5, y: 0, z: 3.5 });
  });

  it('should reject move if new position is invalid', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    state.placeItem(item, { x: 2.5, z: 2.5 }, 0);
    const result = state.moveItem('item-1#1', { x: 10, z: 10 }); // За границей
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('OUT_OF_BOUNDS');
  });

  it('should rotate item by 90 degrees', () => {
    const bounds = createBounds(10, 10);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 2); // Прямоугольный предмет

    state.placeItem(item, { x: 5, z: 5 }, 0);
    const result = state.rotateItem('item-1#1');
    
    expect(result.success).toBe(true);
    const items = state.getItems();
    expect(items[0].rotation).toBe(90);
  });

  it('should assign unique instance ids when the same catalog item is placed twice', () => {
    const state = new RoomState(createBounds(5, 5));
    const item = createTestItem('repeatable-item', 1, 1);

    state.placeItem(item, { x: 2.5, y: 0, z: 2.5 });
    state.placeItem(item, { x: 2.5, y: 1, z: 2.5 });

    expect(state.getItems()).toHaveLength(2);
    expect(state.getItems().map(placed => placed.id)).toEqual(['repeatable-item#1', 'repeatable-item#2']);
    expect(state.getItemsByCatalogItemId('repeatable-item')).toHaveLength(2);
    expect(state.getItem('repeatable-item')).toBeNull();
    expect(state.moveItem('repeatable-item', { x: 3, z: 3 })).toEqual({ success: false, error: 'NOT_FOUND', data: null });
    expect(state.getItems()[1].position).toEqual({ x: 2.5, y: 1, z: 2.5 });
  });

  it('should remove item successfully', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    const item = createTestItem('item-1', 1, 1);

    state.placeItem(item, { x: 2.5, z: 2.5 }, 0);
    const result = state.removeItem('item-1#1');

    expect(result.success).toBe(true);
    expect(result.data.instanceId).toBe('item-1#1');
    expect(state.getItems()).toHaveLength(0);
  });

  it('should return null when removing non-existent item', () => {
    const bounds = createBounds(5, 5);
    const state = new RoomState(bounds);
    
    const result = state.removeItem('non-existent');

    expect(result).toEqual({ success: false, error: 'NOT_FOUND', data: null });
  });

  it('should reject a snapshot that references an unknown catalog item', () => {
    const bounds = createBounds(5, 5);
    const snapshot = {
      items: [{ id: 'unknown#1', itemId: 'unknown', position: { x: 2.5, z: 2.5 }, rotation: 0 }]
    };

    expect(() => RoomState.deserialize(snapshot, bounds, new Map())).toThrow(
      'RoomState snapshot references unknown catalog item: unknown'
    );
  });

  it('should reject a snapshot with a malformed or noncanonical instance id', () => {
    const bounds = createBounds(5, 5);
    const item = createTestItem('item-1', 1, 1);
    const snapshot = {
      items: [{ id: 'item-1#01', itemId: 'item-1', position: { x: 2.5, z: 2.5 }, rotation: 0 }]
    };

    expect(() => RoomState.deserialize(snapshot, bounds, new Map([['item-1', item]]))).toThrow(
      'RoomState snapshot contains invalid placement: INVALID_INSTANCE_ID'
    );
  });

  it('should reject a snapshot with duplicate instance ids', () => {
    const bounds = createBounds(5, 5);
    const item = createTestItem('item-1', 1, 1);
    const snapshot = {
      items: [
        { id: 'item-1#1', itemId: 'item-1', position: { x: 2.5, z: 2.5 }, rotation: 0 },
        { id: 'item-1#1', itemId: 'item-1', position: { x: 3.5, z: 2.5 }, rotation: 0 }
      ]
    };

    expect(() => RoomState.deserialize(snapshot, bounds, new Map([['item-1', item]]))).toThrow(
      'RoomState snapshot contains invalid placement: DUPLICATE_INSTANCE_ID'
    );
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
    expect(restored.getItems()[0].id).toBe('item-1#1');
    expect(restored.getItems()[0].position).toEqual({ x: 2.5, y: 0, z: 2.5 });
  });
});
