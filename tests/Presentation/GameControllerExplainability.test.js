import { describe, expect, it, vi } from 'vitest';
import { GameController } from '../../src/Presentation/Controllers/GameController.js';

function createController({ existingInstanceId = 'item-001' } = {}) {
  const controller = new GameController({
    loadLevelUseCase: {},
    placeItemUseCase: { execute: vi.fn() },
    moveItemUseCase: { execute: vi.fn() },
    rotateItemUseCase: {},
    removeItemUseCase: { execute: vi.fn() },
    evaluateRoomUseCase: {},
    roomRepository: {}
  });
  controller.roomViewModel = {
    roomState: { getItem: vi.fn(id => id === existingInstanceId ? { id, item: { name: 'Кресло' } } : null) },
    selectItem: vi.fn()
  };
  controller.roomView = { cancelPlacement: vi.fn() };
  controller._render = vi.fn();
  controller._showStatus = vi.fn();
  controller._invalidateEvaluation = vi.fn();
  return controller;
}

describe('GameController explainability focus', () => {
  it('selects an existing explained instance through current view state without mutating or invalidating evaluation', () => {
    const controller = createController();

    controller._onExplainabilityFocus('item-001');

    expect(controller.roomViewModel.roomState.getItem).toHaveBeenCalledWith('item-001');
    expect(controller.roomViewModel.selectItem).toHaveBeenCalledWith('item-001');
    expect(controller.roomView.cancelPlacement).toHaveBeenCalledTimes(1);
    expect(controller._render).toHaveBeenCalledTimes(1);
    expect(controller._invalidateEvaluation).not.toHaveBeenCalled();
    expect(controller.placeItemUseCase.execute).not.toHaveBeenCalled();
    expect(controller.moveItemUseCase.execute).not.toHaveBeenCalled();
    expect(controller.removeItemUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects a stale explanation instance reference without changing current selection', () => {
    const controller = createController({ existingInstanceId: 'item-001' });

    controller._onExplainabilityFocus('removed-instance');

    expect(controller.roomViewModel.selectItem).not.toHaveBeenCalled();
    expect(controller._render).not.toHaveBeenCalled();
    expect(controller._showStatus).toHaveBeenCalledWith('Предмет из результата оценки больше не находится в комнате. Оцените комнату повторно.');
  });
});
