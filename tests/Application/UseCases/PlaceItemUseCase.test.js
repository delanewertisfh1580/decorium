import { describe, it, expect, beforeEach } from 'vitest';
import PlaceItemUseCase from '../../../src/Application/UseCases/PlaceItemUseCase.js';
import PlacementResultDTO from '../../../src/Application/DTOs/PlacementResultDTO.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';

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
    it('should place an item in a loaded room', async () => {
      const itemData = {
        id: 'chair-01',
        name: 'Wooden Chair',
        type: 'seating',
        features: {
          woodShare: 0.8,
          metalShare: 0.1,
          glassShare: 0.0,
          plasticShare: 0.05,
          textileShare: 0.0,
          lightColorShare: 0.7,
          darkColorShare: 0.3,
          warmPaletteShare: 0.6,
          coolPaletteShare: 0.4,
          saturationLevel: 0.3,
          formSimplicity: 0.8,
          roundnessShare: 0.2,
          rectilinearShare: 0.8,
          sizeNorm: 0.5,
          priceNorm: 0.4,
          lightingFunctionShare: 0.0,
          storageFunctionShare: 0.0
        }
      };
      const position = { x: 1, y: 0, z: 2 };
      const rotation = { x: 0, y: 0, z: 0, w: 1 };
      await repository.saveState('room-loaded', RoomState.createEmpty(createTestBounds()));

      const result = await useCase.execute('room-loaded', itemData, position, rotation);

      expect(result.success).toBe(true);
      expect(result.itemId).toBe('chair-01');
      expect(result.position).toEqual(position);
      
      // Verify state was saved
      const savedState = await repository.getState('room-loaded');
      expect(savedState).toBeInstanceOf(RoomState);
    });

    it('should add an item to an existing room', async () => {
      // Pre-populate room
      const initialState = RoomState.createEmpty(createTestBounds());
      await repository.saveState('room-existing', initialState);

      const itemData = {
        id: 'table-01',
        name: 'Table',
        type: 'surface',
        features: {
          woodShare: 0.6,
          metalShare: 0.2,
          glassShare: 0.1,
          plasticShare: 0.1,
          textileShare: 0.0,
          lightColorShare: 0.5,
          darkColorShare: 0.5,
          warmPaletteShare: 0.5,
          coolPaletteShare: 0.5,
          saturationLevel: 0.4,
          formSimplicity: 0.7,
          roundnessShare: 0.3,
          rectilinearShare: 0.7,
          sizeNorm: 0.5,
          priceNorm: 0.5,
          lightingFunctionShare: 0.0,
          storageFunctionShare: 0.0
        }
      };
      const result = await useCase.execute('room-existing', itemData, { x: 1, y: 0, z: 1 }, { x: 0, y: 0, z: 0, w: 1 });

      expect(result.success).toBe(true);
      
      const savedState = await repository.getState('room-existing');
      expect(savedState).toBeInstanceOf(RoomState);
    });
  });

  describe('Error Handling', () => {
    it('returns a typed failure for a room that was not loaded', async () => {
      const itemData = {
        id: 'big-item',
        name: 'Big Item',
        type: 'generic',
        features: {
          woodShare: 0.5,
          metalShare: 0.3,
          glassShare: 0.1,
          plasticShare: 0.1,
          textileShare: 0.0,
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
          lightingFunctionShare: 0.0,
          storageFunctionShare: 0.0
        }
      };
      
      const result = await useCase.execute('room-1', itemData, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
      
      expect(result).toMatchObject({
        success: false,
        error: 'ROOM_NOT_FOUND: Room room-1 not found.'
      });
    });
  });
});
