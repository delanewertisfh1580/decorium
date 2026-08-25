import { WORKSPACE_SCREENS, WorkspaceState } from '../UI/WorkspaceState.js';

function requireCallback(callback) {
  return typeof callback === 'function' ? callback : () => {};
}

/**
 * Persistent chrome for the player workspace.
 * Domain/gameplay behavior remains owned by callbacks supplied by the controller.
 */
export class WorkspaceShellView {
  constructor(container, callbacks = {}) {
    this.container = container ?? null;
    this.callbacks = Object.freeze({
      onCampaign: requireCallback(callbacks.onCampaign),
      onBrief: requireCallback(callbacks.onBrief),
      onCatalog: requireCallback(callbacks.onCatalog),
      onUndo: requireCallback(callbacks.onUndo),
      onEvaluate: requireCallback(callbacks.onEvaluate),
      onRoom: requireCallback(callbacks.onRoom),
      onSettings: requireCallback(callbacks.onSettings)
    });
    this._rendered = false;
  }

  render({ state = WorkspaceState.edit(), levelLabel = 'Комната', placedCount = 0, canUndo = false } = {}) {
    if (!this.container) return;
    if (!(state instanceof WorkspaceState)) {
      throw new Error('WorkspaceShellView state must be a WorkspaceState');
    }

    if (!this._rendered) {
      this.container.innerHTML = `
        <header class="workspace-app-bar" data-workspace-app-bar>
          <button class="workspace-nav-button" type="button" data-workspace-action="campaign" aria-label="Открыть кампанию">
            <span aria-hidden="true">←</span><span>Кампания</span>
          </button>
          <div class="workspace-level-context" aria-live="polite">
            <strong data-workspace-level-label></strong><span data-workspace-placed-count></span>
          </div>
          <div class="workspace-app-actions">
            <button class="workspace-icon-button" type="button" data-workspace-action="brief" aria-label="Открыть бриф клиента">Бриф</button>
            <button class="workspace-icon-button" type="button" data-workspace-action="room" aria-label="Открыть настройку комнаты">Комната</button>
            <button class="workspace-icon-button" type="button" data-workspace-action="settings" aria-label="Открыть настройки">⚙</button>
          </div>
        </header>
        <aside class="workspace-drawer-slot" data-workspace-drawer aria-label="Активная панель">
          <div data-workspace-drawer-mount="catalog"></div>
          <div data-workspace-drawer-mount="brief"></div>
          <div data-workspace-drawer-mount="inspector"></div>
        </aside>
        <footer class="workspace-command-dock" data-workspace-command-dock>
          <button class="workspace-dock-action" type="button" data-workspace-action="catalog">
            <span aria-hidden="true">⌂</span><span>Каталог</span>
          </button>
          <button class="workspace-dock-action" type="button" data-workspace-action="undo">
            <span aria-hidden="true">↶</span><span>Отменить</span>
          </button>
          <button class="workspace-dock-action workspace-primary-action" type="button" data-workspace-action="evaluate">
            <span aria-hidden="true">✦</span><span>Оценить</span>
          </button>
        </footer>
      `;
      const actions = {
        campaign: this.callbacks.onCampaign,
        brief: this.callbacks.onBrief,
        catalog: this.callbacks.onCatalog,
        undo: this.callbacks.onUndo,
        evaluate: this.callbacks.onEvaluate,
        room: this.callbacks.onRoom,
        settings: this.callbacks.onSettings
      };
      for (const [action, callback] of Object.entries(actions)) {
        this.container.querySelector(`[data-workspace-action="${action}"]`)?.addEventListener('click', callback);
      }
      this._rendered = true;
    }
    this.container.dataset.workspaceScreen = state.screen;
    this.container.dataset.activeDrawer = state.activeDrawer;
    this.container.querySelector('[data-workspace-level-label]').textContent = levelLabel;
    this.container.querySelector('[data-workspace-placed-count]').textContent = `${placedCount} предметов`;
    this.container.querySelector('[data-workspace-action="undo"]').disabled = !canUndo;
    this.container.querySelector('[data-workspace-command-dock]').hidden = state.screen !== WORKSPACE_SCREENS.EDIT;
  }

  get drawerContainer() {
    return this.container?.querySelector('[data-workspace-drawer]') ?? null;
  }

  get catalogContainer() {
    return this.container?.querySelector('[data-workspace-drawer-mount="catalog"]') ?? null;
  }

  get briefContainer() {
    return this.container?.querySelector('[data-workspace-drawer-mount="brief"]') ?? null;
  }

  get inspectorContainer() {
    return this.container?.querySelector('[data-workspace-drawer-mount="inspector"]') ?? null;
  }

  destroy() {
    this.container?.replaceChildren();
    this._rendered = false;
    this.container = null;
  }
}

export default WorkspaceShellView;
