import { RoomState } from '../../Domain/Rooms/RoomState.js';
import { RoomViewModel } from '../ViewModels/RoomViewModel.js';
import { EvaluationViewModel } from '../ViewModels/EvaluationViewModel.js';
import { RoomView } from '../Views/RoomView.js';
import { ItemCatalogView } from '../Views/ItemCatalogView.js';
import { ToolbarView } from '../Views/ToolbarView.js';
import { EvaluationView } from '../Views/EvaluationView.js';

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
      onFloorClick: position => this._onFloorClick(position)
    });
    document.addEventListener('keydown', this._onKeyDown);
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
    this.pendingItemId = itemId;
    this.roomViewModel.clearSelection();
    this._showStatus('Выберите точку на полу для размещения предмета');
    this._render();
  }

  _onRoomItemSelect(itemId) {
    this.pendingItemId = null;
    this.roomViewModel.selectItem(itemId);
    this._showStatus('Предмет выбран — кликните по полу, чтобы переместить его');
    this._render();
  }

  async _onFloorClick(position) {
    if (this.pendingItemId) {
      const item = this.roomViewModel.availableItems.find(candidate => candidate.id === this.pendingItemId);
      const result = await this.placeItemUseCase.execute(this.level.roomId, item, position, { x: 0, y: 0, z: 0 });
      if (!result.success) {
        this._showStatus(result.error);
        return;
      }
      this.roomViewModel.selectItem(item.id);
      this.pendingItemId = null;
      this._showStatus(`${item.name} размещён`);
      this._render();
      return;
    }

    if (this.roomViewModel.selectedItemId) {
      const result = await this.moveItemUseCase.execute(this.level.roomId, this.roomViewModel.selectedItemId, position);
      if (!result.success) {
        this._showStatus(result.error);
        return;
      }
      this._showStatus('Предмет перемещён');
      this._render();
    }
  }

  async _onRotate() {
    const itemId = this.roomViewModel.selectedItemId;
    if (!itemId) return;
    const result = await this.rotateItemUseCase.execute(this.level.roomId, itemId, { y: 90 });
    this._showStatus(result.success ? 'Предмет повернут' : result.error);
    if (result.success) this._render();
  }

  async _onDelete() {
    const itemId = this.roomViewModel.selectedItemId;
    if (!itemId) return;
    const result = await this.removeItemUseCase.execute(this.level.roomId, itemId);
    this._showStatus(result.success ? 'Предмет удалён' : result.error);
    if (result.success) {
      this.roomViewModel.clearSelection();
      this._render();
    }
  }

  async _onClear() {
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
    this.evaluationViewModel.update(result.evaluationData);
    this.evaluationView.render(result.evaluationData);
    this._renderDashboard();
  }

  _onKeyDown = event => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key.toLowerCase() === 'r') this._onRotate();
    if (event.key === 'Delete' || event.key === 'Backspace') this._onDelete();
    if (event.key.toLowerCase() === 'e') this._onEvaluate();
    if (event.key === 'Escape') {
      this.pendingItemId = null;
      this.roomViewModel.clearSelection();
      this._render();
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
    document.removeEventListener('keydown', this._onKeyDown);
    this.roomView?.destroy();
    this.catalogView?.destroy();
    this.toolbarView?.destroy();
    this.evaluationView?.destroy();
  }
}
