import UndoBuffer from './UndoBuffer.js';

export class RoomInteractionCoordinator {
  constructor({
    getRoomView = () => null,
    getCatalogView = () => null,
    getRoomViewModel = () => null,
    getLevel = () => null,
    placeItemUseCase = null,
    moveItemUseCase = null,
    rotateItemUseCase = null,
    removeItemUseCase = null,
    configurePlacedItemUseCase = null,
    configureRoomSurfaceUseCase = null,
    refreshRoomState = async () => {},
    onEvaluationInvalidated = () => {},
    onStatus = () => {},
    onRequestRender = () => {}
  } = {}) {
    this.getRoomView = getRoomView;
    this.getCatalogView = getCatalogView;
    this.getRoomViewModel = getRoomViewModel;
    this.getLevel = getLevel;
    this.placeItemUseCase = placeItemUseCase;
    this.moveItemUseCase = moveItemUseCase;
    this.rotateItemUseCase = rotateItemUseCase;
    this.removeItemUseCase = removeItemUseCase;
    this.configurePlacedItemUseCase = configurePlacedItemUseCase;
    this.configureRoomSurfaceUseCase = configureRoomSurfaceUseCase;
    this.refreshRoomState = refreshRoomState;
    this.onEvaluationInvalidated = onEvaluationInvalidated;
    this.onStatus = onStatus;
    this.onRequestRender = onRequestRender;
    this.pendingItemId = null;
    this.undoBuffer = new UndoBuffer();
  }

  beginCatalogPlacement(itemId) {
    const roomViewModel = this.getRoomViewModel();
    const item = roomViewModel?.getItemById(itemId);
    if (!item) return false;
    this.pendingItemId = itemId;
    this.getCatalogView()?.close();
    roomViewModel.clearSelection();
    this.getRoomView()?.beginPlacement(item);
    this.onStatus('Размещение доступно: кликните в комнате · R/Q — повернуть · ПКМ — отмена');
    this.onRequestRender();
    return true;
  }

  selectRoomItem(itemId) {
    const roomViewModel = this.getRoomViewModel();
    if (!roomViewModel) return false;
    this.pendingItemId = null;
    this.getRoomView()?.cancelPlacement();
    roomViewModel.selectItem(itemId);
    this.onStatus('Перетащите предмет или кликните по полу для перемещения');
    this.onRequestRender();
    return true;
  }

  focusExistingItem(itemId) {
    const roomViewModel = this.getRoomViewModel();
    if (!roomViewModel?.roomState?.getItem(itemId)) return false;
    this.pendingItemId = null;
    this.getRoomView()?.cancelPlacement();
    roomViewModel.selectItem(itemId);
    return true;
  }

  cancelSelection({ announce = true, render = true } = {}) {
    const roomViewModel = this.getRoomViewModel();
    this.pendingItemId = null;
    this.getRoomView()?.cancelPlacement();
    roomViewModel?.clearSelection();
    if (announce) this.onStatus('Выделение отменено');
    if (render && roomViewModel) this.onRequestRender();
  }

  preview(itemId, position, mode = 'place', rotation = 0) {
    const roomViewModel = this.getRoomViewModel();
    const roomState = roomViewModel?.roomState;
    const item = roomViewModel?.getItemById(itemId);
    if (!roomState || !item) return false;
    return mode === 'move'
      ? roomState.validateMove(itemId, position).success
      : roomState.validatePlacement(item, position, rotation).success;
  }

  async handleFloorClick(position) {
    const selectedItemId = this.getRoomViewModel()?.selectedItemId;
    if (!selectedItemId) return false;
    await this.move(selectedItemId, position);
    return true;
  }

  async place(itemId, position, rotation = 0) {
    const level = this.getLevel();
    const roomViewModel = this.getRoomViewModel();
    const item = roomViewModel?.getItemById(itemId);
    if (!level || !item || !this.placeItemUseCase?.execute) return null;
    const result = await this.placeItemUseCase.execute(
      level.roomId,
      item,
      position,
      { x: 0, y: rotation, z: 0 }
    );
    if (!result.success) {
      this.onStatus(result.error);
      this.onRequestRender();
      return result;
    }
    const placedInstanceId = result.instanceId ?? item.id;
    this.undoBuffer.push({
      label: `Отменить размещение: ${item.name}`,
      undo: async () => {
        const undoResult = await this.removeItemUseCase.execute(level.roomId, placedInstanceId);
        if (!undoResult.success) throw new Error(undoResult.error);
      }
    });
    await this._afterSuccessfulMutation({
      cancelPlacement: true,
      selectedItemId: placedInstanceId
    });
    this.onStatus(`${item.name} размещён · Z — отменить`);
    this.onRequestRender();
    return result;
  }

  async move(itemId, position) {
    const level = this.getLevel();
    const roomViewModel = this.getRoomViewModel();
    if (!level || !roomViewModel || !this.moveItemUseCase?.execute) return null;
    const placedBefore = roomViewModel.roomState.getItem(itemId);
    const previousPosition = placedBefore ? { ...placedBefore.position } : null;
    const result = await this.moveItemUseCase.execute(level.roomId, itemId, position);
    if (result.success) {
      if (previousPosition) {
        this.undoBuffer.push({
          label: 'Отменить перемещение',
          undo: async () => {
            const undoResult = await this.moveItemUseCase.execute(level.roomId, itemId, previousPosition);
            if (!undoResult.success) throw new Error(undoResult.error);
          }
        });
      }
      await this._afterSuccessfulMutation();
    }
    this.onStatus(result.success ? 'Предмет перемещён · Z — отменить' : result.error);
    this.onRequestRender();
    return result;
  }

  async moveVertically(delta) {
    const roomViewModel = this.getRoomViewModel();
    const itemId = roomViewModel?.selectedItemId;
    if (!itemId) return null;
    const placed = roomViewModel.roomState.getItem(itemId);
    if (!placed) return null;
    const position = placed.position;
    position.y = Math.max(0, position.y + delta);
    const result = await this.move(itemId, position);
    if (result?.success) this.onStatus(delta > 0 ? 'Предмет поднят · PageDown опустить' : 'Предмет опущен · PageUp поднять');
    return result;
  }

  async rotate() {
    const roomView = this.getRoomView();
    if (roomView?.ghostItem) {
      if (roomView.rotateGhost()) this.onStatus('Ghost повернут · R/Q — ещё раз · ПКМ — отмена');
      return { success: true, ghost: true };
    }
    const level = this.getLevel();
    const roomViewModel = this.getRoomViewModel();
    const itemId = roomViewModel?.selectedItemId;
    if (!level || !itemId || !this.rotateItemUseCase?.execute) return null;
    const result = await this.rotateItemUseCase.execute(level.roomId, itemId, { y: 90 });
    if (result.success) {
      this.undoBuffer.push({
        label: 'Отменить поворот',
        undo: async () => {
          const undoResult = await this.rotateItemUseCase.execute(level.roomId, itemId, { y: -90 });
          if (!undoResult.success) throw new Error(undoResult.error);
        }
      });
      await this._afterSuccessfulMutation();
      this.onRequestRender();
    }
    this.onStatus(result.success ? 'Предмет повернут · Z — отменить' : result.error);
    return result;
  }

  async configureSelectedItem(variantId) {
    const level = this.getLevel();
    const roomViewModel = this.getRoomViewModel();
    const instanceId = roomViewModel?.selectedItemId;
    if (!level || !instanceId || !this.configurePlacedItemUseCase?.execute) return null;
    const placed = roomViewModel.roomState.getItem(instanceId);
    if (!placed) return null;
    const previousConfiguration = placed.configuration ? { ...placed.configuration } : null;
    const result = await this.configurePlacedItemUseCase.execute(level.roomId, instanceId, { variantId });
    if (!result.success) {
      this.onStatus(result.error);
      return result;
    }
    this.undoBuffer.push({
      label: 'Отменить вариант предмета',
      undo: async () => {
        const undoResult = await this.configurePlacedItemUseCase.execute(level.roomId, instanceId, previousConfiguration);
        if (!undoResult.success) throw new Error(undoResult.error);
        return undoResult;
      }
    });
    await this._afterSuccessfulMutation({ selectedItemId: instanceId });
    this.onStatus('Вариант предмета обновлён · Z — отменить');
    this.onRequestRender();
    return result;
  }

  async configureSurface(surface, finishId) {
    const level = this.getLevel();
    const roomViewModel = this.getRoomViewModel();
    if (!level || !roomViewModel || !this.configureRoomSurfaceUseCase?.execute) return null;
    const previousFinishId = surface === 'floor'
      ? roomViewModel.roomState.surfaceConfiguration?.floorFinishId
      : roomViewModel.roomState.surfaceConfiguration?.wallFinishId;
    const result = await this.configureRoomSurfaceUseCase.execute(level.roomId, surface, finishId);
    if (!result.success) {
      this.onStatus(result.error);
      return result;
    }
    this.undoBuffer.push({
      label: `Отменить отделку ${surface === 'floor' ? 'пола' : 'стены'}`,
      undo: async () => {
        const undoResult = await this.configureRoomSurfaceUseCase.execute(level.roomId, surface, previousFinishId);
        if (!undoResult.success) throw new Error(undoResult.error);
        return undoResult;
      }
    });
    await this._afterSuccessfulMutation();
    this.onStatus('Отделка комнаты обновлена · Z — отменить');
    this.onRequestRender();
    return result;
  }

  async removeSelected() {
    const level = this.getLevel();
    const roomViewModel = this.getRoomViewModel();
    const itemId = roomViewModel?.selectedItemId;
    if (!level || !itemId || !this.removeItemUseCase?.execute) return null;
    const placedBefore = roomViewModel.roomState.getItem(itemId);
    const restoreData = placedBefore ? {
      item: placedBefore.item,
      position: { ...placedBefore.position },
      rotation: { x: 0, y: placedBefore.rotation, z: 0 }
    } : null;
    const result = await this.removeItemUseCase.execute(level.roomId, itemId);
    this.onStatus(result.success ? 'Предмет удалён · Z — отменить' : result.error);
    if (!result.success) return result;
    if (restoreData) {
      this.undoBuffer.push({
        label: 'Отменить удаление',
        undo: async () => {
          const undoResult = await this.placeItemUseCase.execute(
            level.roomId,
            restoreData.item,
            restoreData.position,
            restoreData.rotation
          );
          if (!undoResult.success) throw new Error(undoResult.error);
          return undoResult;
        }
      });
    }
    await this._afterSuccessfulMutation({ clearSelection: true });
    this.onRequestRender();
    return result;
  }

  async undo() {
    if (!this.undoBuffer.canUndo) return { success: false, label: null };
    try {
      const result = await this.undoBuffer.undo();
      if (!result.success) return result;
      await this.refreshRoomState();
      this.onEvaluationInvalidated();
      const roomViewModel = this.getRoomViewModel();
      const restoredInstanceId = result.value?.instanceId;
      if (restoredInstanceId) roomViewModel?.selectItem(restoredInstanceId);
      else if (roomViewModel?.selectedItemId && !roomViewModel.roomState.getItem(roomViewModel.selectedItemId)) {
        roomViewModel.clearSelection();
      }
      this.onStatus(`${result.label} отменено`);
      this.onRequestRender();
      return result;
    } catch (error) {
      this.onStatus(`Не удалось отменить действие: ${error.message}`);
      this.onRequestRender();
      return { success: false, error };
    }
  }

  resetTransientState() {
    this.cancelSelection({ announce: false, render: false });
    this.undoBuffer.clear();
  }

  async _afterSuccessfulMutation({ cancelPlacement = false, selectedItemId = null, clearSelection = false } = {}) {
    await this.refreshRoomState();
    this.onEvaluationInvalidated();
    const roomViewModel = this.getRoomViewModel();
    if (cancelPlacement) {
      this.getRoomView()?.cancelPlacement();
      this.pendingItemId = null;
    }
    if (clearSelection) roomViewModel?.clearSelection();
    else if (selectedItemId) roomViewModel?.selectItem(selectedItemId);
  }
}

export default RoomInteractionCoordinator;
