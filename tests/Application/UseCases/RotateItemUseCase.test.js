import { describe, it, expect } from 'vitest';
import RotateItemUseCase from '../../../src/Application/UseCases/RotateItemUseCase.js';
import RotateResultDTO from '../../../src/Application/DTOs/RotateResultDTO.js';

class MockRoomRepository {
  constructor(scenario) {
    this.scenario = scenario;
    this.savedState = null;
  }

  async loadRoomState(roomId) {
    if (this.scenario === 'room_not_found') return null;
    
    // Создаем мок комнаты с getItem и rotateItem
    return {
      getItem: (id) => id === 'item-1' ? { id: 'item-1', name: 'Chair' } : null,
      rotateItem: (id, rotation) => {
        // Простая логика: принимаем только кратные 90 градусам по Y
        if (rotation.y === undefined || typeof rotation.y !== 'number') return null;
        if (rotation.y % 90 !== 0) return null;
        // Возвращаем новое состояние комнаты
        return {
          getItem: (itemId) => itemId === 'item-1' ? { id: 'item-1', name: 'Chair' } : null,
          rotateItem: () => null
        };
      }
    };
  }

  async saveRoomState(roomId, roomState) {
    this.savedState = roomState;
    return true;
  }
}

describe('RotateItemUseCase', () => {
  it('should return failure for invalid roomId', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new RotateItemUseCase(repo);
    
    const result = await useCase.execute('', 'item-1', { y: 90 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return failure for invalid itemId', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new RotateItemUseCase(repo);
    
    const result = await useCase.execute('room-1', '', { y: 90 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return failure for invalid rotation (no y-axis)', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new RotateItemUseCase(repo);
    
    const result = await useCase.execute('room-1', 'item-1', { x: 90 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return failure for non-multiple of 90 degrees', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new RotateItemUseCase(repo);
    
    const result = await useCase.execute('room-1', 'item-1', { y: 45 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return failure if room not found', async () => {
    const repo = new MockRoomRepository('room_not_found');
    const useCase = new RotateItemUseCase(repo);
    
    const result = await useCase.execute('room-999', 'item-1', { y: 90 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('ROOM_NOT_FOUND');
  });

  it('should return failure if item not found in room', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new RotateItemUseCase(repo);
    
    // Мокируем комнату без нужного предмета
    repo.loadRoomState = async () => ({
      getItem: () => null,
      rotateItem: () => null
    });
    
    const result = await useCase.execute('room-1', 'item-999', { y: 90 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('ITEM_NOT_FOUND');
  });

  it('should return failure if domain rejects rotation', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new RotateItemUseCase(repo);
    
    // Мокируем отклонение поворота доменом (например, отрицательный угол)
    repo.loadRoomState = async () => ({
      getItem: (id) => id === 'item-1' ? { id: 'item-1' } : null,
      rotateItem: (id, rot) => {
        // Домен отклоняет отрицательные углы
        if (rot.y < 0) return null;
        return {
          getItem: (itemId) => itemId === 'item-1' ? { id: 'item-1' } : null,
          rotateItem: () => null
        };
      }
    });
    
    const result = await useCase.execute('room-1', 'item-1', { y: -90 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('ROTATION_REJECTED');
  });

  it('should successfully rotate item and save state', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new RotateItemUseCase(repo);

    const rotationDelta = { y: 90 };
    const newRotation = { x: 0, y: 90, z: 0 };

    // Мокируем успешный поворот
    repo.loadRoomState = async () => ({
      getItem: (id) => id === 'item-1' ? { id: 'item-1' } : null,
      rotateItem: (id, rot) => {
        if (rot.y % 90 !== 0) return null;
        // Возвращаем новое состояние комнаты
        return {
          getItem: (itemId) => itemId === 'item-1' ? { id: 'item-1' } : null,
          rotateItem: () => null
        };
      }
    });

    const result = await useCase.execute('room-1', 'item-1', rotationDelta);

    expect(result.success).toBe(true);
    expect(result.itemId).toBe('item-1');
    expect(result.newRotation).toEqual(newRotation);
    expect(repo.savedState).not.toBeNull();
  });

  it('should handle repository errors gracefully', async () => {
    const repo = new MockRoomRepository('valid');
    const useCase = new RotateItemUseCase(repo);
    
    // Мокируем ошибку репозитория
    repo.loadRoomState = async () => {
      throw new Error('Database connection failed');
    };
    
    const result = await useCase.execute('room-1', 'item-1', { y: 90 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('UNEXPECTED_ERROR');
  });
});
