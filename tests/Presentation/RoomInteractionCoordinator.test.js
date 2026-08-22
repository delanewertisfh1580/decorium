import { describe, expect, it, vi } from 'vitest';
import { RoomInteractionCoordinator } from '../../src/Presentation/Controllers/RoomInteractionCoordinator.js';

function createCoordinator() {
  const item = { id: 'chair-001', name: 'Стул' };
  const roomState = {
    getItem: vi.fn(id => id === item.id ? { id, item } : null),
    validatePlacement: vi.fn(() => ({ success: true })),
    validateMove: vi.fn(() => ({ success: true }))
  };
  const roomViewModel = {
    roomState,
    selectedItemId: null,
    getItemById: vi.fn(id => id === item.id ? item : null),
    selectItem: vi.fn(function selectItem(id) { this.selectedItemId = id; }),
    clearSelection: vi.fn(function clearSelection() { this.selectedItemId = null; })
  };
  const roomView = { beginPlacement: vi.fn(), cancelPlacement: vi.fn() };
  const catalogView = { close: vi.fn() };
  const moveItemUseCase = { execute: vi.fn(async () => ({ success: true, itemId: item.id })) };
  const ports = {
    onStatus: vi.fn(),
    onRequestRender: vi.fn()
  };
  const coordinator = new RoomInteractionCoordinator({
    getRoomView: () => roomView,
    getCatalogView: () => catalogView,
    getRoomViewModel: () => roomViewModel,
    getLevel: () => ({ roomId: 'room-001' }),
    moveItemUseCase,
    refreshRoomState: vi.fn(async () => {}),
    ...ports
  });
  return { coordinator, item, roomState, roomViewModel, roomView, catalogView, moveItemUseCase, ports };
}

describe('RoomInteractionCoordinator', () => {
  it('starts catalog placement as transient UI state without invoking a use case', () => {
    const { coordinator, item, roomViewModel, roomView, catalogView, ports } = createCoordinator();

    expect(coordinator.beginCatalogPlacement(item.id)).toBe(true);

    expect(coordinator.pendingItemId).toBe(item.id);
    expect(catalogView.close).toHaveBeenCalledTimes(1);
    expect(roomViewModel.clearSelection).toHaveBeenCalledTimes(1);
    expect(roomView.beginPlacement).toHaveBeenCalledWith(item);
    expect(ports.onStatus).toHaveBeenCalledWith('Размещение доступно: кликните в комнате · R/Q — повернуть · ПКМ — отмена');
    expect(ports.onRequestRender).toHaveBeenCalledTimes(1);
  });

  it('uses current room state only for local preview validity', () => {
    const { coordinator, item, roomState } = createCoordinator();

    expect(coordinator.preview(item.id, { x: 2, z: 2 }, 'place', 90)).toBe(true);
    expect(coordinator.preview(item.id, { x: 2, z: 2 }, 'move')).toBe(true);

    expect(roomState.validatePlacement).toHaveBeenCalledWith(item, { x: 2, z: 2 }, 90);
    expect(roomState.validateMove).toHaveBeenCalledWith(item.id, { x: 2, z: 2 });
  });

  it('routes floor click only for an active selection', async () => {
    const { coordinator, roomViewModel, moveItemUseCase } = createCoordinator();

    expect(await coordinator.handleFloorClick({ x: 2, z: 2 })).toBe(false);
    expect(moveItemUseCase.execute).not.toHaveBeenCalled();

    roomViewModel.selectedItemId = 'chair-001';
    expect(await coordinator.handleFloorClick({ x: 3, z: 2 })).toBe(true);
    expect(moveItemUseCase.execute).toHaveBeenCalledWith('room-001', 'chair-001', { x: 3, z: 2 });
  });

  it('cancels selection and resets pending placement state', () => {
    const { coordinator, roomViewModel, roomView, ports } = createCoordinator();
    coordinator.pendingItemId = 'chair-001';
    roomViewModel.selectedItemId = 'chair-001';

    coordinator.cancelSelection();

    expect(coordinator.pendingItemId).toBeNull();
    expect(roomView.cancelPlacement).toHaveBeenCalledTimes(1);
    expect(roomViewModel.clearSelection).toHaveBeenCalledTimes(1);
    expect(ports.onStatus).toHaveBeenCalledWith('Выделение отменено');
    expect(ports.onRequestRender).toHaveBeenCalledTimes(1);
  });

  it('keeps fixture interaction in presentation by emitting only status messages', () => {
    const { coordinator, ports } = createCoordinator();

    coordinator.handleFixtureSelect('ambient-mirror');
    coordinator.handleFixtureMove('bookshelf');

    expect(ports.onStatus).toHaveBeenNthCalledWith(1, 'Зеркало выбрано · перетащите по стене');
    expect(ports.onStatus).toHaveBeenNthCalledWith(2, 'Полка перемещена');
  });
});
