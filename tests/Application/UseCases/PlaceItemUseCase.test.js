import { describe, it, expect, beforeEach } from 'vitest';
import PlaceItemUseCase from '../../../src/Application/UseCases/PlaceItemUseCase.js';
import PlacementResultDTO from '../../../src/Application/DTOs/PlacementResultDTO.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';

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

describe('Slice A-002: PlaceItemUseCase', () => {
  let repository;
  let useCase;

  beforeEach(() => {
    repository = new MockRoomRepository();
    useCase = new PlaceItemUseCase(repository);
  });

  describe('Input Validation', () => {
    it('should fail if roomId is missing', async () => {
      const result = await useCase.execute('', { id: 'item-1' }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_INPUT');
    });

    it('should fail if itemData is missing', async () => {
      const result = await useCase.execute('room-1', null, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_INPUT');
    });

    it('should fail if position is invalid', async () => {
      const result = await useCase.execute('room-1', { id: 'item-1' }, null, { x: 0, y: 0, z: 0, w: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_INPUT');
    });

    it('should fail if rotation is invalid', async () => {
      const result = await useCase.execute('room-1', { id: 'item-1' }, { x: 0, y: 0, z: 0 }, null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_INPUT');
    });
  });

  describe('Successful Placement', () => {
    it('should place an item in a new room', async () => {
      const itemData = {
        id: 'chair-01',
        name: 'Wooden Chair',
        type: 'seating',
        features: {
          woodShare: 0.8,
          metalShare: 0.1,
          glassShare: 0.0,
          lightColorShare: 0.7,
          warmPaletteShare: 0.6,
          formSimplicity: 0.8,
          saturationLevel: 0.3,
          plasticShare: 0.05
        }
      };
      const position = { x: 1, y: 0, z: 2 };
      const rotation = { x: 0, y: 0, z: 0, w: 1 };

      const result = await useCase.execute('room-new', itemData, position, rotation);

      expect(result.success).toBe(true);
      expect(result.itemId).toBe('chair-01');
      expect(result.position).toEqual(position);
      
      // Verify state was saved
      const savedState = await repository.getState('room-new');
      expect(savedState).toBeInstanceOf(RoomState);
    });

    it('should add an item to an existing room', async () => {
      // Pre-populate room
      const initialState = RoomState.createEmpty();
      await repository.saveState('room-existing', initialState);

      const itemData = {
        id: 'table-01',
        name: 'Table',
        type: 'surface',
        features: {
          woodShare: 0.6,
          metalShare: 0.2,
          glassShare: 0.1,
          lightColorShare: 0.5,
          warmPaletteShare: 0.5,
          formSimplicity: 0.7,
          saturationLevel: 0.4,
          plasticShare: 0.1
        }
      };
      const result = await useCase.execute('room-existing', itemData, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });

      expect(result.success).toBe(true);
      
      const savedState = await repository.getState('room-existing');
      expect(savedState).toBeInstanceOf(RoomState);
    });
  });

  describe('Error Handling', () => {
    it('should handle domain rule violations gracefully', async () => {
      const itemData = {
        id: 'big-item',
        name: 'Big Item',
        type: 'generic',
        features: {
          woodShare: 0.5,
          metalShare: 0.3,
          glassShare: 0.1,
          lightColorShare: 0.4,
          warmPaletteShare: 0.4,
          formSimplicity: 0.6,
          saturationLevel: 0.5,
          plasticShare: 0.2
        }
      };
      
      const result = await useCase.execute('room-1', itemData, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
      
      // Verify the result structure is correct even if operation fails
      expect(result).toBeDefined();
      expect(result.success !== undefined).toBe(true);
    });
  });
});
