import { describe, expect, it, vi } from 'vitest';
import ConfigurePlacedItemUseCase from '../../../src/Application/UseCases/ConfigurePlacedItemUseCase.js';
import ConfigureRoomSurfaceUseCase from '../../../src/Application/UseCases/ConfigureRoomSurfaceUseCase.js';

const unlockedProfile = { hasUnlock: unlockId => ['base-interior', 'material-artisan', 'floor-oak'].includes(unlockId) };

describe('room design configuration use cases', () => {
  it('persists a valid unlocked placed-item configuration', async () => {
    const item = { baseVariantId: 'base', getVariant: vi.fn(id => id === 'oak' ? { id, unlockId: 'material-artisan' } : null) };
    const state = {
      getItem: vi.fn(() => ({ item })),
      configureItem: vi.fn(() => ({ success: true, data: { instanceId: 'sofa-001#1', configuration: { variantId: 'oak' } } }))
    };
    const repository = { getState: vi.fn(async () => state), saveState: vi.fn(async () => true) };
    const result = await new ConfigurePlacedItemUseCase(repository, () => unlockedProfile).execute('room-1', 'sofa-001#1', { variantId: 'oak' });
    expect(result).toEqual({ success: true, data: { instanceId: 'sofa-001#1', configuration: { variantId: 'oak' } } });
    expect(repository.saveState).toHaveBeenCalledWith('room-1', state);
  });

  it('rejects a locked item variant before mutating state', async () => {
    const state = { getItem: vi.fn(() => ({ item: { baseVariantId: 'base', getVariant: () => ({ unlockId: 'material-artisan' }) } })), configureItem: vi.fn() };
    const repository = { getState: vi.fn(async () => state), saveState: vi.fn() };
    const result = await new ConfigurePlacedItemUseCase(repository, () => ({ hasUnlock: () => false })).execute('room-1', 'sofa-001#1', { variantId: 'accent' });
    expect(result).toEqual({ success: false, error: 'VARIANT_LOCKED' });
    expect(state.configureItem).not.toHaveBeenCalled();
  });

  it('does not persist a rejected unlocked surface configuration', async () => {
    const state = { configureSurface: vi.fn(() => ({ success: false, error: 'SURFACE_CONFIGURATION_UNAVAILABLE' })) };
    const repository = { getState: vi.fn(async () => state), saveState: vi.fn(async () => true) };
    const finishCatalog = { getById: vi.fn(async () => ({ id: 'floor-oak', surface: 'floor', unlockId: 'floor-oak' })) };
    const result = await new ConfigureRoomSurfaceUseCase(repository, finishCatalog, () => unlockedProfile).execute('room-1', 'floor', 'floor-oak');
    expect(result).toEqual({ success: false, error: 'SURFACE_CONFIGURATION_UNAVAILABLE' });
    expect(repository.saveState).not.toHaveBeenCalled();
  });

  it('rejects a locked finish before room mutation', async () => {
    const state = { configureSurface: vi.fn() };
    const repository = { getState: vi.fn(async () => state), saveState: vi.fn() };
    const finishCatalog = { getById: vi.fn(async () => ({ id: 'wall-graphite', surface: 'wall', unlockId: 'wall-graphite' })) };
    const result = await new ConfigureRoomSurfaceUseCase(repository, finishCatalog, () => ({ hasUnlock: () => false })).execute('room-1', 'wall', 'wall-graphite');
    expect(result).toEqual({ success: false, error: 'SURFACE_FINISH_LOCKED' });
    expect(state.configureSurface).not.toHaveBeenCalled();
  });
});
