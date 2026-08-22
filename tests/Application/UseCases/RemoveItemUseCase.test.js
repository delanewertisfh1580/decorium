import { describe, it, expect, beforeEach } from 'vitest';
import RemoveItemUseCase from '../../../src/Application/UseCases/RemoveItemUseCase.js';
import RemoveResultDTO from '../../../src/Application/DTOs/RemoveResultDTO.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

// Mock Repository Implementation for Tests
class MockRoomRepository {
  constructor() {
    this.storage = new Map();
  }

  async saveState(roomId, roomState) {
    this.storage.set(roomId, roomState);
    return true;
  }

  async getState(roomId) {
    return this.storage.get(roomId) || null;
  }
}

const createTestBounds = () => new RoomBounds(5, 5);
const createTestItem = itemData => new Item({
  ...itemData,
  interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: ['lounge-seat'] }),
  spatialBehavior: new SpatialBehavior({
    schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
  })
});

describe('Slice A-005: RemoveItemUseCase', () => {
  let repository;
  let useCase;

  beforeEach(() => {
    repository = new MockRoomRepository();
    useCase = new RemoveItemUseCase(repository);
  });

  describe('Input Validation', () => {
    it('should fail if roomId is missing', async () => {
      const result = await useCase.execute('', 'item-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_INPUT');
    });

    it('should fail if instanceId is missing', async () => {
      const result = await useCase.execute('room-1', '');
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_INPUT');
    });

    it('should fail if roomId is not a string', async () => {
      const result = await useCase.execute(null, 'item-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_INPUT');
    });

    it('should fail if instanceId is not a string', async () => {
      const result = await useCase.execute('room-1', null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_INPUT');
    });
  });

  describe('Room Not Found', () => {
    it('should fail if room does not exist', async () => {
      const result = await useCase.execute('non-existent-room', 'item-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ROOM_NOT_FOUND');
    });
  });

  describe('Instance Not Found', () => {
    it('should fail if instance is not in the room', async () => {
      // Create a room with one item
      const featureVector = new FeatureVector({
        woodShare: 0.8,
        metalShare: 0.1,
        glassShare: 0.0,
        plasticShare: 0.0,
        textileShare: 0.0,
        lightColorShare: 0.7,
        darkColorShare: 0.3,
        warmPaletteShare: 0.6,
        coolPaletteShare: 0.4,
        saturationLevel: 0.5,
        formSimplicity: 0.8,
        roundnessShare: 0.2,
        rectilinearShare: 0.8,
        sizeNorm: 0.5,
        priceNorm: 0.5,
        lightingFunctionShare: 0.0,
        storageFunctionShare: 0.0
      });
      const existingItem = createTestItem({
        id: 'existing-item',
        name: 'Existing Item',
        type: 'seating',
        featureVector: featureVector
      });
      const initialState = RoomState.createEmpty(createTestBounds());
      expect(initialState.placeItem(existingItem, { x: 1, z: 1 }).success).toBe(true);
      await repository.saveState('room-with-item', initialState);

      // Try to remove a non-existent item
      const result = await useCase.execute('room-with-item', 'non-existent-item#1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('INSTANCE_NOT_FOUND');
    });
  });

  describe('Successful Removal', () => {
    it('should remove an item from the room', async () => {
      // Create a room with two items
      const featureVector1 = new FeatureVector({
        woodShare: 0.8,
        metalShare: 0.1,
        glassShare: 0.0,
        plasticShare: 0.0,
        textileShare: 0.0,
        lightColorShare: 0.7,
        darkColorShare: 0.3,
        warmPaletteShare: 0.6,
        coolPaletteShare: 0.4,
        saturationLevel: 0.5,
        formSimplicity: 0.8,
        roundnessShare: 0.2,
        rectilinearShare: 0.8,
        sizeNorm: 0.5,
        priceNorm: 0.5,
        lightingFunctionShare: 0.0,
        storageFunctionShare: 0.0
      });
      const featureVector2 = new FeatureVector({
        woodShare: 0.6,
        metalShare: 0.2,
        glassShare: 0.1,
        plasticShare: 0.1,
        textileShare: 0.2,
        lightColorShare: 0.5,
        darkColorShare: 0.5,
        warmPaletteShare: 0.5,
        coolPaletteShare: 0.5,
        saturationLevel: 0.4,
        formSimplicity: 0.7,
        roundnessShare: 0.4,
        rectilinearShare: 0.6,
        sizeNorm: 0.5,
        priceNorm: 0.5,
        lightingFunctionShare: 0.1,
        storageFunctionShare: 0.2
      });
      const item1 = createTestItem({
        id: 'item-1',
        name: 'First Item',
        type: 'seating',
        featureVector: featureVector1
      });
      const item2 = createTestItem({
        id: 'item-2',
        name: 'Second Item',
        type: 'surface',
        featureVector: featureVector2
      });
      
      const initialState = RoomState.createEmpty(createTestBounds());
      expect(initialState.placeItem(item1, { x: 1, z: 1 }).success).toBe(true);
      expect(initialState.placeItem(item2, { x: 2, z: 1 }).success).toBe(true);
      
      await repository.saveState('room-multi', initialState);

      // Remove first item
      const result = await useCase.execute('room-multi', 'item-1#1');

      expect(result.success).toBe(true);
      expect(result.instanceId).toBe('item-1#1');
      expect(result.remainingItemCount).toBe(1);

      // Verify state was updated
      const savedState = await repository.getState('room-multi');
      expect(savedState).toBeInstanceOf(RoomState);
      expect(savedState.getItemCount()).toBe(1);
      expect(savedState.getItem('item-1#1')).toBeNull();
      expect(savedState.getItem('item-2#1')).toBeDefined();
    });

    it('should remove the last item from the room', async () => {
      // Create a room with one item
      const featureVector = new FeatureVector({
        woodShare: 0.8,
        metalShare: 0.1,
        glassShare: 0.0,
        plasticShare: 0.0,
        textileShare: 0.0,
        lightColorShare: 0.7,
        darkColorShare: 0.3,
        warmPaletteShare: 0.6,
        coolPaletteShare: 0.4,
        saturationLevel: 0.5,
        formSimplicity: 0.8,
        roundnessShare: 0.2,
        rectilinearShare: 0.8,
        sizeNorm: 0.5,
        priceNorm: 0.5,
        lightingFunctionShare: 0.0,
        storageFunctionShare: 0.0
      });
      const singleItem = createTestItem({
        id: 'only-item',
        name: 'Only Item',
        type: 'seating',
        featureVector: featureVector
      });
      const initialState = RoomState.createEmpty(createTestBounds());
      expect(initialState.placeItem(singleItem, { x: 1, z: 1 }).success).toBe(true);
      await repository.saveState('room-single', initialState);

      // Remove the only item
      const result = await useCase.execute('room-single', 'only-item#1');

      expect(result.success).toBe(true);
      expect(result.instanceId).toBe('only-item#1');
      expect(result.remainingItemCount).toBe(0);

      // Verify room is empty
      const savedState = await repository.getState('room-single');
      expect(savedState).toBeInstanceOf(RoomState);
      expect(savedState.getItemCount()).toBe(0);
    });

    it('should return correct remaining count when removing from multiple items', async () => {
      // Create a room with three items
      const items = [];
      for (let i = 1; i <= 3; i++) {
        const featureVector = new FeatureVector({
          woodShare: 0.5,
          metalShare: 0.3,
          glassShare: 0.1,
          plasticShare: 0.2,
          textileShare: 0.3,
          lightColorShare: 0.4,
          darkColorShare: 0.6,
          warmPaletteShare: 0.4,
          coolPaletteShare: 0.6,
          saturationLevel: 0.5,
          formSimplicity: 0.6,
          roundnessShare: 0.4,
          rectilinearShare: 0.6,
          sizeNorm: 0.5,
          priceNorm: 0.5,
          lightingFunctionShare: 0.2,
          storageFunctionShare: 0.3
        });
        items.push(createTestItem({
          id: `item-${i}`,
          name: `Item ${i}`,
          type: 'generic',
          featureVector: featureVector
        }));
      }
      
      const initialState = RoomState.createEmpty(createTestBounds());
      items.forEach((item, index) => {
        expect(initialState.placeItem(item, { x: 1 + index, z: 1 }).success).toBe(true);
      });
      
      await repository.saveState('room-three', initialState);

      // Remove middle item
      const result = await useCase.execute('room-three', 'item-2#1');

      expect(result.success).toBe(true);
      expect(result.instanceId).toBe('item-2#1');
      expect(result.remainingItemCount).toBe(2);

      // Verify correct items remain
      const savedState = await repository.getState('room-three');
      expect(savedState.getItemCount()).toBe(2);
      expect(savedState.getItem('item-1#1')).toBeDefined();
      expect(savedState.getItem('item-2#1')).toBeNull();
      expect(savedState.getItem('item-3#1')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Create a repository that throws errors
      const errorRepository = {
        async getState(roomId) {
          throw new Error('Database connection failed');
        },
        async saveState(roomId, roomState) {
          throw new Error('Database connection failed');
        }
      };

      const errorUseCase = new RemoveItemUseCase(errorRepository);
      const result = await errorUseCase.execute('room-1', 'item-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('UNEXPECTED_ERROR');
    });

    it('should handle domain exceptions gracefully', async () => {
      // Create a repository that returns corrupted state
      const corruptedRepository = {
        async getState(roomId) {
          // Return an object that's not a proper RoomState
          return { getItem: () => { throw new Error('Corrupted state'); } };
        },
        async saveState(roomId, roomState) {
          return true;
        }
      };

      const corruptedUseCase = new RemoveItemUseCase(corruptedRepository);
      const result = await corruptedUseCase.execute('room-corrupted', 'item-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('DTO Structure', () => {
    it('should return proper DTO structure on success', async () => {
      const featureVector = new FeatureVector({
        woodShare: 0.8,
        metalShare: 0.1,
        glassShare: 0.0,
        plasticShare: 0.0,
        textileShare: 0.0,
        lightColorShare: 0.7,
        darkColorShare: 0.3,
        warmPaletteShare: 0.6,
        coolPaletteShare: 0.4,
        saturationLevel: 0.5,
        formSimplicity: 0.8,
        roundnessShare: 0.2,
        rectilinearShare: 0.8,
        sizeNorm: 0.5,
        priceNorm: 0.5,
        lightingFunctionShare: 0.0,
        storageFunctionShare: 0.0
      });
      const item = createTestItem({
        id: 'test-item',
        name: 'Test Item',
        type: 'seating',
        featureVector: featureVector
      });
      const initialState = RoomState.createEmpty(createTestBounds());
      expect(initialState.placeItem(item, { x: 1, z: 1 }).success).toBe(true);
      await repository.saveState('room-test', initialState);

      const result = await useCase.execute('room-test', 'test-item#1');

      expect(result).toBeInstanceOf(RemoveResultDTO);
      expect(result.success).toBe(true);
      expect(result.instanceId).toBe('test-item#1');
      expect(result.remainingItemCount).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should return proper DTO structure on failure', async () => {
      const result = await useCase.execute('room-1', 'item-1');

      expect(result).toBeInstanceOf(RemoveResultDTO);
      expect(result.success).toBe(false);
      expect(result.instanceId).toBeNull();
      expect(result.remainingItemCount).toBeNull();
      expect(result.error).toBeDefined();
    });
  });
});
