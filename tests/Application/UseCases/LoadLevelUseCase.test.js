import { describe, it, expect } from 'vitest';
import LoadLevelUseCase from '../../../src/Application/UseCases/LoadLevelUseCase.js';
import LevelDTO from '../../../src/Application/DTOs/LevelDTO.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { LinearConstraint } from '../../../src/Domain/Constraints/LinearConstraint.js';

// Mock Repository
class MockLevelRepository {
  constructor(scenario) {
    this.scenario = scenario;
  }

  async loadLevel(levelId) {
    if (this.scenario === 'not_found') return null;
    if (this.scenario === 'invalid_data') return { id: levelId }; // missing roomId
    
    return {
      id: levelId,
      roomId: 'room-001',
      styleId: 'scandinavian',
      items: [
        {
          id: 'item-1',
          name: 'Chair',
          type: 'seating',
          features: { 
            woodShare: 0.8, 
            metalShare: 0.1,
            glassShare: 0.05,
            plasticShare: 0.02,
            textileShare: 0.0,
            lightColorShare: 0.7,
            darkColorShare: 0.3,
            warmPaletteShare: 0.6,
            coolPaletteShare: 0.4,
            saturationLevel: 0.3,
            formSimplicity: 0.9,
            roundnessShare: 0.2,
            rectilinearShare: 0.8,
            sizeNorm: 0.5,
            priceNorm: 0.5,
            lightingFunctionShare: 0.0,
            storageFunctionShare: 0.0
          },
          metadata: {}
        }
      ],
      constraints: [
        { feature: 'wood_share', operator: '>=', threshold: 0.6, weight: 1.0 }
      ]
    };
  }
}

describe('LoadLevelUseCase', () => {
  it('should return error for empty levelId', async () => {
    const repo = new MockLevelRepository('valid');
    const useCase = new LoadLevelUseCase(repo);
    
    const result = await useCase.execute('');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return error for null levelId', async () => {
    const repo = new MockLevelRepository('valid');
    const useCase = new LoadLevelUseCase(repo);
    
    const result = await useCase.execute(null);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_INPUT');
  });

  it('should return error if level not found', async () => {
    const repo = new MockLevelRepository('not_found');
    const useCase = new LoadLevelUseCase(repo);
    
    const result = await useCase.execute('level-999');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('LEVEL_NOT_FOUND');
  });

  it('should return error if level data is invalid (missing roomId)', async () => {
    const repo = new MockLevelRepository('invalid_data');
    const useCase = new LoadLevelUseCase(repo);
    
    const result = await useCase.execute('level-bad');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_LEVEL_DATA');
  });

  it('should successfully load valid level and return DTO', async () => {
    const repo = new MockLevelRepository('valid');
    const useCase = new LoadLevelUseCase(repo);
    
    const result = await useCase.execute('level-001');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(LevelDTO);
    expect(result.data.levelId).toBe('level-001');
    expect(result.data.roomId).toBe('room-001');
    expect(result.data.styleId).toBe('scandinavian');
    expect(result.data.roomState).toBeInstanceOf(RoomState);
    expect(result.data.availableItems).toHaveLength(1);
    expect(result.data.availableItems[0]).toBeInstanceOf(Item);
    expect(result.data.constraints).toHaveLength(1);
    expect(result.data.constraints[0]).toBeInstanceOf(LinearConstraint);
  });
});
