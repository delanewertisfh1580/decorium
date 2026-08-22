import { describe, it, expect, beforeEach } from 'vitest';
import MoveItemUseCase from '../../../src/Application/UseCases/MoveItemUseCase.js';
import MoveResultDTO from '../../../src/Application/DTOs/MoveResultDTO.js';

class MockRoomRepository {
  constructor(scenario) {
    this.scenario = scenario;
    this.savedState = null;
  }

  async loadRoomState(roomId) {
    if (this.scenario === 'room_not_found') return null;
    
    return {
      getItem: id => id === 'item-1' ? { id: 'item-1' } : null,
      moveItem: (id, pos) => id === 'item-1' && pos.x >= 0
    };
  }

  async saveRoomState(roomId, roomState) {
    this.savedState = roomState;
    return true;
  }
}

describe('MoveItemUseCase', () => {
  it('should return failure for invalid roomId', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new MoveItemUseCase(repo);
    
    const result = await useCase.execute('', 'item-1', { x: 1, y: 1, z: 1 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return failure for invalid itemId', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new MoveItemUseCase(repo);
    
    const result = await useCase.execute('room-1', '', { x: 1, y: 1, z: 1 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return failure for invalid position', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new MoveItemUseCase(repo);
    
    const result = await useCase.execute('room-1', 'item-1', { x: 'a', y: 1, z: 1 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return failure if room not found', async () => {
    const repo = new MockRoomRepository('room_not_found');
    const useCase = new MoveItemUseCase(repo);
    
    const result = await useCase.execute('room-999', 'item-1', { x: 1, y: 1, z: 1 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('ROOM_NOT_FOUND');
  });

  it('should return failure if item not found in room', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new MoveItemUseCase(repo);
    
    // Мокируем комнату без нужного предмета
    repo.loadRoomState = async () => ({
      getItem: () => null,
      moveItem: () => false
    });
    
    const result = await useCase.execute('room-1', 'item-999', { x: 1, y: 1, z: 1 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('ITEM_NOT_FOUND');
  });

  it('should return failure if domain rejects move (e.g., out of bounds)', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new MoveItemUseCase(repo);
    
    // Мокируем отклонение перемещения (x < 0)
    repo.loadRoomState = async () => ({
      getItem: (id) => id === 'item-1' ? {} : null,
      moveItem: (id, pos) => pos.x >= 0 // Отклоняем отрицательные X
    });
    
    const result = await useCase.execute('room-1', 'item-1', { x: -5, y: 0, z: 0 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('MOVE_REJECTED');
  });

  it('should successfully move item and save state', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new MoveItemUseCase(repo);
    
    const newPosition = { x: 2, y: 3, z: 1 };
    
    // Мокируем успешное перемещение
    repo.loadRoomState = async () => ({
      getItem: (id) => id === 'item-1' ? { id: 'item-1' } : null,
      moveItem: (id, pos) => true // Всегда успешно для этого теста
    });
    
    const result = await useCase.execute('room-1', 'item-1', newPosition);
    
    expect(result.success).toBe(true);
    expect(result.itemId).toBe('item-1');
    expect(result.newPosition).toEqual(newPosition);
    expect(repo.savedState).not.toBeNull();
  });
});
