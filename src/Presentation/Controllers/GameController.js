import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { RoomViewModel } from '../ViewModels/RoomViewModel.js';
import { EvaluationViewModel } from '../ViewModels/EvaluationViewModel.js';
import { RoomView } from '../Views/RoomView.js';
import { ItemCatalogView } from '../Views/ItemCatalogView.js';
import { ToolbarView } from '../Views/ToolbarView.js';
import { EvaluationView } from '../Views/EvaluationView.js';
import { getKeyboardAction, isEditableKeyboardTarget } from './KeyboardShortcuts.js';

export class GameController {
  constructor({
    loadLevelUseCase,
    placeItemUseCase,
    moveItemUseCase,
    rotateItemUseCase,
    removeItemUseCase,
    evaluateRoomUseCase,
    roomRepository
  }) {
    this.loadLevelUseCase = loadLevelUseCase;
    this.placeItemUseCase = placeItemUseCase;
    this.moveItemUseCase = moveItemUseCase;
    this.rotateItemUseCase = rotateItemUseCase;
    this.removeItemUseCase = removeItemUseCase;
    this.evaluateRoomUseCase = evaluateRoomUseCase;
    this.roomRepository = roomRepository;
    this.roomView = null;
    this.roomViewModel = null;
    this.evaluationViewModel = new EvaluationViewModel();
    this.pendingItemId = null;
    this._lastEvaluation = null;
  }

  async init(canvas, catalogContainer, toolbarContainer, evaluationContainer) {
    this.roomView = new RoomView(canvas);
    this.catalogView = new ItemCatalogView(catalogContainer, itemId => this._onCatalogSelect(itemId));
    this.toolbarView = new ToolbarView(toolbarContainer, {
      onRotate: () => this._onRotate(),
      onDelete: () => this._onDelete(),
      onClear: () => this._onClear(),
      onEvaluate: () => this._onEvaluate()
    });
    this.evaluationView = new EvaluationView(evaluationContainer);

    await this.roomView.init();
    await this.catalogView.init();
    await this.toolbarView.init();
    await this.evaluationView.init();
    this.roomView.setInteractionHandlers({
      onSelect: itemId => this._onRoomItemSelect(itemId),
      onPlace: (itemId, position) => this._onPlace(itemId, position),
      onMove: (itemId, position) => this._onMove(itemId, position),
      onCancelMove: () => this._render(),
      onFloorClick: position => this._onFloorClick(position),
      onPreview: (itemId, position, mode) => this._previewPlacement(itemId, position, mode)
    });
    // Capture phase keeps shortcuts active even when a catalog/toolbar control owns focus.
    // event.code (handled by getKeyboardAction) makes R/E work on Cyrillic layouts too.
    document.addEventListener('keydown', this._onKeyDown, true);
  }

  async loadLevel(levelId) {
    const result = await this.loadLevelUseCase.execute(levelId);
    if (!result.success) throw new Error(result.error);

    this.level = result.data;
    this.roomViewModel = new RoomViewModel(this.level);
    await this.roomRepository.saveState(this.level.roomId, this.level.roomState);
    this._render();
  }

  _render() {
    this.roomView.render(this.roomViewModel.roomState, this.roomViewModel.selectedItemId);
    this.catalogView.render(this.roomViewModel.availableItems, this.pendingItemId);
    this.toolbarView.setSelectionState(Boolean(this.roomViewModel.selectedItemId));
    this._renderDashboard();
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
    const placedCount = this.roomViewModel.placedItems.length;
    const result = this.evaluationViewModel.isVisible ? this.evaluationViewModel : null;
    dashboard.innerHTML = `
      <h2>${this.roomViewModel.name}</h2>
      <div class="score-line">
        <div><div class="score-label">ПОСЛЕ ОЦЕНКИ</div><div class="score-value">${result ? Math.round(result.score * 100) : '—'}</div></div>
        <div class="stars">${result ? '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars) : '☆☆☆☆☆'}</div>
      </div>
      <div class="stat-list">
        <div class="stat-row"><span>Предметов</span><b>${placedCount}</b></div>
        <div class="stat-row"><span>Ограничений</span><b>${this.roomViewModel.constraints.length}</b></div>
        <div class="stat-row"><span>Стиль</span><b>Scandi</b></div>
      </div>
    `;
  }

  _onCatalogSelect(itemId) {
    const item = this.roomViewModel.getItemById(itemId);
    if (!item) return;
    this.pendingItemId = itemId;
    this.roomViewModel.clearSelection();
    this.roomView.beginPlacement(item);
    this._showStatus('Кликните в комнате, чтобы добавить предмет · пересечения разрешены');
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

  async _onPlace(itemId, position) {
    const item = this.roomViewModel.getItemById(itemId);
    if (!item) return;
    const result = await this.placeItemUseCase.execute(
      this.level.roomId,
      item,
      position,
      { x: 0, y: 0, z: 0 }
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
    this.roomViewModel.selectItem(result.itemId ?? item.id);
    this._showStatus(`${item.name} размещён`);
    this._render();
  }

  async _onMove(itemId, position) {
    const result = await this.moveItemUseCase.execute(this.level.roomId, itemId, position);
    if (result.success) {
      await this._refreshRoomState();
      this._invalidateEvaluation();
    }
    this._showStatus(result.success ? 'Предмет перемещён' : result.error);
    this._render();
  }

  _previewPlacement(itemId, position, mode = 'place') {
    const roomState = this.roomViewModel?.roomState;
    const item = this.roomViewModel?.getItemById(itemId);
    if (!roomState || !item) return false;
    // Geometry overlaps are intentional creative choices in this game. The
    // preview only rejects positions that cannot exist inside the room.
    return mode === 'move'
      ? roomState.validateMove(itemId, position).success
      : roomState.validatePlacement(item, position).success;
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
    const itemId = this.roomViewModel.selectedItemId;
    if (!itemId) return;
    const result = await this.rotateItemUseCase.execute(this.level.roomId, itemId, { y: 90 });
    this._showStatus(result.success ? 'Предмет повернут' : result.error);
    if (result.success) {
      await this._refreshRoomState();
      this._invalidateEvaluation();
      this._render();
    }
  }

  async _onDelete() {
    const itemId = this.roomViewModel.selectedItemId;
    if (!itemId) return;
    const result = await this.removeItemUseCase.execute(this.level.roomId, itemId);
    this._showStatus(result.success ? 'Предмет удалён' : result.error);
    if (result.success) {
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
    await this.roomRepository.saveState(this.level.roomId, this.level.roomState);
    this.evaluationViewModel.reset();
    this.evaluationView.hide();
    this._showStatus('Новая попытка начата');
    this._render();
  }

  async _onEvaluate() {
    const result = await this.evaluateRoomUseCase.execute(this.level.roomId, this.roomViewModel.constraints);
    if (!result.success) {
      this._showStatus(result.error);
      return;
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

    switch (action) {
      case 'rotate':
        this._onRotate();
        break;
      case 'delete':
        this._onDelete();
        break;
      case 'evaluate':
        this._onEvaluate();
        break;
      case 'raise':
        this._onVerticalMove(0.25);
        break;
      case 'lower':
        this._onVerticalMove(-0.25);
        break;
      case 'reset-camera':
        this.roomView.resetCamera();
        break;
      case 'cancel':
        this.pendingItemId = null;
        this.roomView.cancelPlacement();
        this.roomViewModel.clearSelection();
        this._render();
        break;
      default:
        break;
    }
  };

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
