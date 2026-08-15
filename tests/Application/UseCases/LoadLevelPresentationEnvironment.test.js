import { describe, expect, it, vi } from 'vitest';
import { LoadLevelUseCase } from '../../../src/Application/UseCases/LoadLevelUseCase.js';
const item = Object.freeze({ id: 'chair-001' });

const rawLevel = {
  id: 'level-001',
  roomId: 'room-001',
  name: 'Гостиная',
  styleId: 'scandinavian',
  presentationProfileId: 'warm-starter-living',
  roomDimensions: { width: 8, depth: 6 },
  availableItems: ['chair-001'],
  initialPlacement: []
};

const profile = Object.freeze({
  schemaVersion: 1,
  id: 'warm-starter-living',
  presentation: Object.freeze({ title: 'Гостиная', subtitle: 'Первые шаги' })
});

describe('LoadLevelUseCase presentation environment hydration', () => {
  it('hydrates an immutable presentation environment without changing RoomState or scoring inputs', async () => {
    const levelRepository = { loadLevel: vi.fn().mockResolvedValue(rawLevel) };
    const itemCatalog = { getItemsByIds: vi.fn().mockResolvedValue([item]) };
    const presentationEnvironmentRepository = { getById: vi.fn().mockResolvedValue(profile) };
    const useCase = new LoadLevelUseCase(levelRepository, itemCatalog, null, presentationEnvironmentRepository);

    const result = await useCase.execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data.presentationEnvironment).toBe(profile);
    expect(result.data.roomState.width).toBe(8);
    expect(result.data.roomState.depth).toBe(6);
    expect(presentationEnvironmentRepository.getById).toHaveBeenCalledWith('warm-starter-living');
  });

  it('rejects a level whose explicit presentation profile cannot be resolved', async () => {
    const levelRepository = { loadLevel: vi.fn().mockResolvedValue(rawLevel) };
    const itemCatalog = { getItemsByIds: vi.fn().mockResolvedValue([item]) };
    const presentationEnvironmentRepository = { getById: vi.fn().mockResolvedValue(null) };
    const useCase = new LoadLevelUseCase(levelRepository, itemCatalog, null, presentationEnvironmentRepository);

    await expect(useCase.execute('level-001')).resolves.toEqual({
      success: false,
      error: 'INVALID_LEVEL_DATA: Unknown presentation profile warm-starter-living'
    });
  });
});
