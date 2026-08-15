import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { RoomViewModel } from '../ViewModels/RoomViewModel.js';
import { EvaluationViewModel } from '../ViewModels/EvaluationViewModel.js';
import { RoomView } from '../Views/RoomView.js';
import { ItemCatalogView } from '../Views/ItemCatalogView.js';
import { ToolbarView } from '../Views/ToolbarView.js';
import { EvaluationView } from '../Views/EvaluationView.js';
import { INPUT_INTENTS } from './InputIntent.js';
import { getKeyboardAction, isEditableKeyboardTarget } from './KeyboardShortcuts.js';
import UndoBuffer from './UndoBuffer.js';

export class GameController {
  constructor({
    loadLevelUseCase,
    placeItemUseCase,
    moveItemUseCase,
    rotateItemUseCase,
    removeItemUseCase,
    evaluateRoomUseCase,
    recordLevelCompletionUseCase,
    playerProfile = null,
    roomRepository
  }) {
    this.loadLevelUseCase = loadLevelUseCase;
    this.placeItemUseCase = placeItemUseCase;
    this.moveItemUseCase = moveItemUseCase;
    this.rotateItemUseCase = rotateItemUseCase;
    this.removeItemUseCase = removeItemUseCase;
    this.evaluateRoomUseCase = evaluateRoomUseCase;
    this.recordLevelCompletionUseCase = recordLevelCompletionUseCase;
    this.playerProfile = playerProfile;
    this.playerSettings = playerProfile?.settings ?? null;
    this.roomRepository = roomRepository;
    this.roomView = null;
    this.roomViewModel = null;
    this.evaluationViewModel = new EvaluationViewModel();
    this.pendingItemId = null;
    this._lastEvaluation = null;
    this.undoBuffer = new UndoBuffer();
    this._dashboardOpen = false;
    this.completionProfileListener = null;
  }

  async init(canvas, catalogContainer, toolbarContainer, evaluationContainer) {
    this.roomView = new RoomView(canvas);
    if (this.playerSettings) this.roomView.setRenderSettings(this.playerSettings);
    this.catalogView = new ItemCatalogView(catalogContainer, itemId => this._onCatalogSelect(itemId));
    this.toolbarView = new ToolbarView(toolbarContainer, {
      onRotate: () => this._dispatchIntent(INPUT_INTENTS.ROTATE),
      onDelete: () => this._dispatchIntent(INPUT_INTENTS.DELETE),
      onUndo: () => this._dispatchIntent(INPUT_INTENTS.UNDO),
      onRaise: () => this._dispatchIntent(INPUT_INTENTS.RAISE),
      onLower: () => this._dispatchIntent(INPUT_INTENTS.LOWER),
      onResetCamera: () => this._dispatchIntent(INPUT_INTENTS.RESET_CAMERA),
      onClear: () => this._onClear(),
      onEvaluate: () => this._dispatchIntent(INPUT_INTENTS.EVALUATE)
    });
    this.evaluationView = new EvaluationView(evaluationContainer);

    await this.roomView.init();
    await this.catalogView.init();
    await this.toolbarView.init();
    await this.evaluationView.init();
    this.roomView.setInteractionHandlers({
      onSelect: itemId => this._onRoomItemSelect(itemId),
      onPlace: (itemId, position, rotation) => this._onPlace(itemId, position, rotation),
      onMove: (itemId, position) => this._onMove(itemId, position),
      onCancelMove: () => this._render(),
      onDeselect: () => this._onDeselect(),
      onFloorClick: position => this._onFloorClick(position),
      onFixtureSelect: fixtureId => this._showStatus(fixtureId === 'ambient-mirror' ? 'Зеркало выбрано · перетащите по стене' : 'Полка выбрана · перетащите по стене'),
      onFixtureMove: fixtureId => this._showStatus(fixtureId === 'ambient-mirror' ? 'Зеркало перемещено' : 'Полка перемещена'),
      onPreview: (itemId, position, mode, rotation) => this._previewPlacement(itemId, position, mode, rotation)
    });
    // Capture phase keeps shortcuts active even when a catalog/toolbar control owns focus.
    // event.code (handled by getKeyboardAction) makes R/E work on Cyrillic layouts too.
    document.addEventListener('keydown', this._onKeyDown, true);
  }

  setCompletionProfileListener(listener) {
    if (listener !== null && typeof listener !== 'function') {
      throw new Error('GameController completion profile listener must be a function or null.');
    }
    this.completionProfileListener = listener;
  }

  setPlayerProfile(profile) {
    this.playerProfile = profile;
    if (profile?.settings) this.setPlayerSettings(profile.settings);
  }

  setPlayerSettings(settings) {
    this.playerSettings = { ...settings };
    this.roomView?.setRenderSettings(this.playerSettings);
  }

  async loadLevel(levelId) {
    const result = await this.loadLevelUseCase.execute(levelId);
    if (!result.success) throw new Error(result.error);

    this.level = result.data;
    this.roomView.setPresentationEnvironment(this.level.presentationEnvironment);
    this.roomViewModel = new RoomViewModel(this.level);
    await this.roomRepository.saveState(this.level.roomId, this.level.roomState);
    this._render();
  }

  _render() {
    this.roomView.render(this.roomViewModel.roomState, this.roomViewModel.selectedItemId);
    this.catalogView.render(this.roomViewModel.availableItems, this.pendingItemId);
    this._renderDashboard();
    this.toolbarView.setSelectionState(Boolean(this.roomViewModel.selectedItemId));
    this.toolbarView.setUndoState(this.undoBuffer.canUndo, this.undoBuffer.nextLabel);
  }

  _invalidateEvaluation() {
    if (!this.evaluationViewModel.isVisible) return;
    this.evaluationViewModel.reset();
    this.evaluationView.hide();
    this._lastEvaluation = null;
  }

  _renderDashboard() {
    const dashboard = document.getElementById('dashboard-container');
    if (!dashboard || !this.roomViewModel) return;
    const existingSpoiler = dashboard.querySelector('[data-dashboard-spoiler]');
    if (existingSpoiler) this._dashboardOpen = existingSpoiler.open;
    const placedCount = this.roomViewModel.placedItems.length;
    const result = this.evaluationViewModel.isVisible ? this.evaluationViewModel : null;
    dashboard.innerHTML = `
      <details class="dashboard-spoiler" data-dashboard-spoiler${this._dashboardOpen ? ' open' : ''}>
        <summary class="dashboard-toggle" aria-label="Открыть сводку оценки">
          <span class="dashboard-toggle-icon" aria-hidden="true">✦</span>
          <span class="dashboard-toggle-copy"><b>Сводка</b><small>${placedCount} предметов</small></span>
          <span class="dashboard-toggle-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="dashboard-content">
          <span class="eyebrow">${this.roomViewModel.name}</span>
          <div class="summary-main">
            <div class="summary-score">
              <span class="score-label">Оценка</span>
              <strong class="score-value">${result ? Math.round(result.score * 100) : '—'}</strong>
            </div>
            <div class="stars" aria-label="${result ? result.stars : 0} из 5 звёзд">${result ? '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars) : '☆☆☆☆☆'}</div>
          </div>
          <div class="summary-meta">
            <span><b>${placedCount}</b> предметов</span>
            <span>${this.level?.presentationEnvironment?.presentation?.subtitle ?? ''}</span>
          </div>
      <details class="summary-actions">
        <summary>Действия предмета</summary>
            <div class="context-actions" data-context-actions></div>
          </details>
        </div>
      </details>
    `;
    dashboard.querySelector('[data-dashboard-spoiler]').addEventListener('toggle', event => {
      this._dashboardOpen = event.currentTarget.open;
    });
    this.toolbarView?.renderContextActions(dashboard.querySelector('[data-context-actions]'));
    this.toolbarView?.setSelectionState(Boolean(this.roomViewModel.selectedItemId));
    this.toolbarView?.setUndoState(this.undoBuffer.canUndo, this.undoBuffer.nextLabel);
  }

  _onCatalogSelect(itemId) {
    const item = this.roomViewModel.getItemById(itemId);
    if (!item) return;
    this.pendingItemId = itemId;
    this.catalogView.close();
    this.roomViewModel.clearSelection();
    this.roomView.beginPlacement(item);
    this._showStatus('Размещение доступно: кликните в комнате · R/Q — повернуть · ПКМ — отмена');
    this._render();
  }

  _onRoomItemSelect(itemId) {
    this.pendingItemId = null;
    this.roomView.cancelPlacement();
    this.roomViewModel.selectItem(itemId);
    this._showStatus('Перетащите предмет или кликните по полу для перемещения');
    this._render();
  }

  async _refreshRoomState() {
    const state = await this.roomRepository.getState(this.level.roomId);
    if (state) this.level.roomState = state;
  }

  async _onPlace(itemId, position, rotation = 0) {
    const item = this.roomViewModel.getItemById(itemId);
    if (!item) return;
    const result = await this.placeItemUseCase.execute(
      this.level.roomId,
      item,
      position,
      { x: 0, y: rotation, z: 0 }
    );
    if (!result.success) {
      this._showStatus(result.error);
      this._render();
      return;
    }
    await this._refreshRoomState();
    this._invalidateEvaluation();
    this.roomView.cancelPlacement();
    this.pendingItemId = null;
    const placedItemId = result.itemId ?? item.id;
    this.roomViewModel.selectItem(placedItemId);
    this.undoBuffer.push({
      label: `Отменить размещение: ${item.name}`,
      undo: async () => {
        const undoResult = await this.removeItemUseCase.execute(this.level.roomId, placedItemId);
        if (!undoResult.success) throw new Error(undoResult.error);
      }
    });
    this._showStatus(`${item.name} размещён · Z — отменить`);
    this._render();
  }

  async _onMove(itemId, position) {
    const placedBefore = this.roomViewModel.roomState.getItem(itemId);
    const previousPosition = placedBefore ? { ...placedBefore.position } : null;
    const result = await this.moveItemUseCase.execute(this.level.roomId, itemId, position);
    if (result.success) {
      if (previousPosition) {
        this.undoBuffer.push({
          label: 'Отменить перемещение',
          undo: async () => {
            const undoResult = await this.moveItemUseCase.execute(this.level.roomId, itemId, previousPosition);
            if (!undoResult.success) throw new Error(undoResult.error);
          }
        });
      }
      await this._refreshRoomState();
      this._invalidateEvaluation();
    }
    this._showStatus(result.success ? 'Предмет перемещён · Z — отменить' : result.error);
    this._render();
  }

  _previewPlacement(itemId, position, mode = 'place', rotation = 0) {
    const roomState = this.roomViewModel?.roomState;
    const item = this.roomViewModel?.getItemById(itemId);
    if (!roomState || !item) return false;
    // Geometry overlaps are intentional creative choices in this game. The
    // preview only rejects positions that cannot exist inside the room.
    return mode === 'move'
      ? roomState.validateMove(itemId, position).success
      : roomState.validatePlacement(item, position, rotation).success;
  }

  async _onFloorClick(position) {
    if (this.roomViewModel.selectedItemId) {
      await this._onMove(this.roomViewModel.selectedItemId, position);
    }
  }

  async _onVerticalMove(delta) {
    const itemId = this.roomViewModel.selectedItemId;
    if (!itemId) return;
    const placed = this.roomViewModel.roomState.getItem(itemId);
    if (!placed) return;
    const position = placed.position;
    position.y = Math.max(0, position.y + delta);
    await this._onMove(itemId, position);
    this._showStatus(delta > 0 ? 'Предмет поднят · PageDown опустить' : 'Предмет опущен · PageUp поднять');
  }

  async _onRotate() {
    if (this.roomView.ghostItem) {
      if (this.roomView.rotateGhost()) this._showStatus('Ghost повернут · R/Q — ещё раз · ПКМ — отмена');
      return;
    }
    const itemId = this.roomViewModel.selectedItemId;
    if (!itemId) return;
    const result = await this.rotateItemUseCase.execute(this.level.roomId, itemId, { y: 90 });
    if (result.success) {
      this.undoBuffer.push({
        label: 'Отменить поворот',
        undo: async () => {
          const undoResult = await this.rotateItemUseCase.execute(this.level.roomId, itemId, { y: -90 });
          if (!undoResult.success) throw new Error(undoResult.error);
        }
      });
    }
    this._showStatus(result.success ? 'Предмет повернут · Z — отменить' : result.error);
    if (result.success) {
      await this._refreshRoomState();
      this._invalidateEvaluation();
      this._render();
    }
  }

  _onDeselect() {
    this.pendingItemId = null;
    this.roomView?.cancelPlacement();
    this.roomViewModel?.clearSelection();
    this._showStatus('Выделение отменено');
    if (this.roomViewModel) this._render();
  }

  async _onDelete() {
    const itemId = this.roomViewModel.selectedItemId;
    if (!itemId) return;
    const placedBefore = this.roomViewModel.roomState.getItem(itemId);
    const restoreData = placedBefore ? {
      item: placedBefore.item,
      position: { ...placedBefore.position },
      rotation: { x: 0, y: placedBefore.rotation, z: 0 }
    } : null;
    const result = await this.removeItemUseCase.execute(this.level.roomId, itemId);
    this._showStatus(result.success ? 'Предмет удалён · Z — отменить' : result.error);
    if (result.success) {
      if (restoreData) {
        this.undoBuffer.push({
          label: 'Отменить удаление',
          undo: async () => {
            const undoResult = await this.placeItemUseCase.execute(
              this.level.roomId,
              restoreData.item,
              restoreData.position,
              restoreData.rotation
            );
            if (!undoResult.success) throw new Error(undoResult.error);
            return undoResult;
          }
        });
      }
      await this._refreshRoomState();
      this._invalidateEvaluation();
      this.roomViewModel.clearSelection();
      this._render();
    }
  }

  async _onClear() {
    this.roomView.cancelPlacement();
    this.level.roomState = RoomState.createEmpty(this.level.roomState.bounds);
    this.roomViewModel = new RoomViewModel(this.level);
    this.pendingItemId = null;
    this.undoBuffer.clear();
    await this.roomRepository.saveState(this.level.roomId, this.level.roomState);
    this.evaluationViewModel.reset();
    this.evaluationView.hide();
    this._showStatus('Новая попытка начата');
    this._render();
  }

  async _onUndo() {
    if (!this.undoBuffer.canUndo) return;

    try {
      const result = await this.undoBuffer.undo();
      if (!result.success) return;
      await this._refreshRoomState();
      this._invalidateEvaluation();
      const restoredItemId = result.value?.itemId;
      if (restoredItemId) this.roomViewModel.selectItem(restoredItemId);
      else if (this.roomViewModel.selectedItemId && !this.roomViewModel.roomState.getItem(this.roomViewModel.selectedItemId)) {
        this.roomViewModel.clearSelection();
      }
      this._showStatus(`${result.label} отменено`);
      this._render();
    } catch (error) {
      this._showStatus(`Не удалось отменить действие: ${error.message}`);
      this._render();
    }
  }

  async _onEvaluate() {
    const result = await this.evaluateRoomUseCase.execute(
      this.level.roomId,
      this.roomViewModel.constraints,
      this.level.compositionRules,
      this.level.ergonomicsRules
    );
    if (!result.success) {
      this._showStatus(result.error);
      return;
    }
    if (this.recordLevelCompletionUseCase && this.playerProfile) {
      const completion = await this.recordLevelCompletionUseCase.execute({
        levelId: this.level.levelId,
        stars: result.evaluationData.stars,
        targetScore: this.level.targetScore,
        profile: this.playerProfile
      });
      if (completion.success) {
        this.setPlayerProfile(completion.data);
        if (completion.didComplete && this.completionProfileListener) {
          await this.completionProfileListener(completion.data);
        }
      } else this._showStatus(`Оценка рассчитана, но прогресс не сохранён: ${completion.error}`);
    }

    this._lastEvaluation = result.evaluationData;
    this.evaluationViewModel.update(result.evaluationData);
    this.evaluationView.render(result.evaluationData);
    this._renderDashboard();
  }

  _onKeyDown = event => {
    if (isEditableKeyboardTarget(event.target)) return;

    const action = getKeyboardAction(event);
    if (!action) return;

    // Prevent browser scrolling/navigation for game controls such as Home and PageUp.
    event.preventDefault();
    if (!this.roomViewModel || !this.roomView) return;

    this._dispatchIntent(action);
  };

  _dispatchIntent(intent) {
    if (!this.roomViewModel || !this.roomView) return;
    switch (intent) {
      case INPUT_INTENTS.ROTATE:
        this._onRotate();
        break;
      case INPUT_INTENTS.DELETE:
        this._onDelete();
        break;
      case INPUT_INTENTS.EVALUATE:
        this._onEvaluate();
        break;
      case INPUT_INTENTS.RAISE:
        this._onVerticalMove(0.25);
        break;
      case INPUT_INTENTS.LOWER:
        this._onVerticalMove(-0.25);
        break;
      case INPUT_INTENTS.RESET_CAMERA:
        this.roomView.resetCamera();
        break;
      case INPUT_INTENTS.UNDO:
        this._onUndo();
        break;
      case INPUT_INTENTS.CANCEL:
        this.pendingItemId = null;
        this.roomView.cancelPlacement();
        this.roomViewModel.clearSelection();
        this._render();
        break;
      default:
        break;
    }
  }

  _showStatus(message) {
    const status = document.getElementById('boot-status');
    if (!status) return;
    status.textContent = message;
    status.classList.remove('hidden');
    clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(() => status.classList.add('hidden'), 2600);
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown, true);
    this.roomView?.destroy();
    this.catalogView?.destroy();
    this.toolbarView?.destroy();
    this.evaluationView?.destroy();
  }
}
