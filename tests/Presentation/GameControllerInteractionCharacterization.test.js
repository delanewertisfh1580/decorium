import { describe, expect, it, vi } from 'vitest';
import { RoomBounds } from '../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../src/Domain/Rooms/RoomState.js';
import { GameController } from '../../src/Presentation/Controllers/GameController.js';

const item = Object.freeze({
  id: 'chair-001',
  name: 'Стул',
  type: 'chair',
  dimensions: { x: 0.5, z: 0.5 },
  featureVector: {}
});

function createRoomState({ itemId = 'chair-001', position = { x: 1, y: 0, z: 1 } } = {}) {
  return {
    bounds: { width: 6, depth: 5 },
    getItem: vi.fn(id => id === itemId ? {
      id: itemId,
      item,
      position: { ...position },
      rotation: 0
    } : null),
    validatePlacement: vi.fn(() => ({ success: true })),
    validateMove: vi.fn(() => ({ success: true }))
  };
}

function createController({
  placeResult = { success: true, itemId: 'chair-001' },
  moveResult = { success: true, itemId: 'chair-001' },
  rotateResult = { success: true, itemId: 'chair-001' },
  removeResult = { success: true, itemId: 'chair-001' },
  roomState = createRoomState()
} = {}) {
  const placeItemUseCase = { execute: vi.fn(async () => placeResult) };
  const moveItemUseCase = { execute: vi.fn(async () => moveResult) };
  const rotateItemUseCase = { execute: vi.fn(async () => rotateResult) };
  const removeItemUseCase = { execute: vi.fn(async () => removeResult) };
  const roomRepository = { getState: vi.fn(async () => roomState), saveState: vi.fn(async () => true) };
  const resetRoomAttemptUseCase = {
    execute: vi.fn(async () => ({
      success: true,
      roomState: RoomState.createEmpty(roomState.bounds)
    }))
  };
  const controller = new GameController({
    loadLevelUseCase: {},
    placeItemUseCase,
    moveItemUseCase,
    rotateItemUseCase,
    removeItemUseCase,
    evaluateRoomUseCase: {},
    resetRoomAttemptUseCase,
    roomRepository
  });
  const roomViewModel = {
    roomState,
    selectedItemId: null,
    constraints: [],
    compositionRules: {},
    ergonomicsRules: {},
    availableItems: [item],
    getItemById: vi.fn(id => id === item.id ? item : null),
    selectItem: vi.fn(function selectItem(id) { this.selectedItemId = id; }),
    clearSelection: vi.fn(function clearSelection() { this.selectedItemId = null; })
  };
  controller.level = {
    levelId: 'level-001',
    roomId: 'room-001',
    roomState,
    compositionRules: {},
    ergonomicsRules: {}
  };
  controller.roomViewModel = roomViewModel;
  controller.roomView = {
    ghostItem: null,
    cancelPlacement: vi.fn(),
    beginPlacement: vi.fn(),
    rotateGhost: vi.fn(() => true)
  };
  controller.catalogView = { close: vi.fn() };
  controller.evaluationView = { hide: vi.fn() };
  controller._refreshRoomState = vi.fn(async () => {});
  controller._invalidateEvaluation = vi.fn();
  controller._render = vi.fn();
  controller._showStatus = vi.fn();
  return {
    controller,
    roomViewModel,
    roomRepository,
    resetRoomAttemptUseCase,
    placeItemUseCase,
    moveItemUseCase,
    rotateItemUseCase,
    removeItemUseCase
  };
}

describe('GameController room interaction characterization', () => {
  it('places a selected catalog item through the use case, invalidates evaluation and records an inverse undo command', async () => {
    const { controller, roomViewModel, placeItemUseCase, removeItemUseCase } = createController();

    await controller._onPlace('chair-001', { x: 2, y: 0, z: 2 }, 90);

    expect(placeItemUseCase.execute).toHaveBeenCalledWith(
      'room-001', item, { x: 2, y: 0, z: 2 }, { x: 0, y: 90, z: 0 }
    );
    expect(controller.roomView.cancelPlacement).toHaveBeenCalledTimes(1);
    expect(roomViewModel.selectItem).toHaveBeenCalledWith('chair-001');
    expect(controller._invalidateEvaluation).toHaveBeenCalledTimes(1);
    expect(controller.undoBuffer.canUndo).toBe(true);

    await controller._onUndo();

    expect(removeItemUseCase.execute).toHaveBeenCalledWith('room-001', 'chair-001');
    expect(controller._invalidateEvaluation).toHaveBeenCalledTimes(2);
  });

  it('keeps an existing evaluation and undo history when placement is rejected', async () => {
    const { controller } = createController({
      placeResult: { success: false, error: 'OUT_OF_BOUNDS' }
    });

    await controller._onPlace('chair-001', { x: -1, y: 0, z: 2 }, 0);

    expect(controller._invalidateEvaluation).not.toHaveBeenCalled();
    expect(controller.undoBuffer.canUndo).toBe(false);
    expect(controller._showStatus).toHaveBeenCalledWith('OUT_OF_BOUNDS');
    expect(controller._render).toHaveBeenCalledTimes(1);
  });

  it('moves a selected item through the use case and restores the original position through undo', async () => {
    const { controller, moveItemUseCase } = createController({
      roomState: createRoomState({ position: { x: 1, y: 0, z: 1 } })
    });

    await controller._onMove('chair-001', { x: 3, y: 0, z: 2 });
    await controller._onUndo();

    expect(moveItemUseCase.execute).toHaveBeenNthCalledWith(1, 'room-001', 'chair-001', { x: 3, y: 0, z: 2 });
    expect(moveItemUseCase.execute).toHaveBeenNthCalledWith(2, 'room-001', 'chair-001', { x: 1, y: 0, z: 1 });
    expect(controller._invalidateEvaluation).toHaveBeenCalledTimes(2);
  });

  it('rotates a ghost locally without invoking the persisted rotation use case', async () => {
    const { controller, rotateItemUseCase } = createController();
    controller.roomView.ghostItem = { id: 'chair-001' };

    await controller._onRotate();

    expect(controller.roomView.rotateGhost).toHaveBeenCalledTimes(1);
    expect(rotateItemUseCase.execute).not.toHaveBeenCalled();
    expect(controller._showStatus).toHaveBeenCalledWith('Ghost повернут · R/Q — ещё раз · ПКМ — отмена');
  });

  it('deletes a selected item and restores it through the placement use case on undo', async () => {
    const { controller, roomViewModel, removeItemUseCase, placeItemUseCase } = createController();
    roomViewModel.selectedItemId = 'chair-001';

    await controller._onDelete();
    await controller._onUndo();

    expect(removeItemUseCase.execute).toHaveBeenCalledWith('room-001', 'chair-001');
    expect(placeItemUseCase.execute).toHaveBeenLastCalledWith(
      'room-001', item, { x: 1, y: 0, z: 1 }, { x: 0, y: 0, z: 0 }
    );
    expect(roomViewModel.clearSelection).toHaveBeenCalled();
  });

  it('starts a new empty attempt with the same room bounds, clears transient state and persists it', async () => {
    const bounds = new RoomBounds(6, 5);
    const state = RoomState.createEmpty(bounds);
    state.placeItem(item, { x: 1, y: 0, z: 1 });
    const { controller, resetRoomAttemptUseCase } = createController({ roomState: state });
    controller.level.roomState = state;
    controller.roomViewModel.roomState = state;
    controller.pendingItemId = 'chair-001';
    controller.undoBuffer.push({ label: 'Тест', undo: async () => {} });
    controller.evaluationViewModel.update({ score: 0.8, stars: 4 });

    await controller._onClear();

    expect(controller.level.roomState).not.toBe(state);
    expect(controller.level.roomState.bounds).toBe(bounds);
    expect(controller.level.roomState.getItemCount()).toBe(0);
    expect(resetRoomAttemptUseCase.execute).toHaveBeenCalledWith('room-001');
    expect(controller.pendingItemId).toBeNull();
    expect(controller.undoBuffer.canUndo).toBe(false);
    expect(controller.evaluationView.hide).toHaveBeenCalledTimes(1);
  });
});
