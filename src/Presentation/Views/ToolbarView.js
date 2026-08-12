const ACTIONS = [
  { id: 'rotate', icon: '↻', label: 'Повернуть', className: 'icon-action' },
  { id: 'delete', icon: '⌫', label: 'Удалить', className: 'icon-action danger-action' },
  { id: 'undo', icon: '↶', label: 'Отменить', className: 'icon-action' }
];

function actionMarkup(action) {
  return `
    <button class="toolbar-button ${action.className}" data-action="${action.id}" type="button" disabled>
      <span class="button-icon" aria-hidden="true">${action.icon}</span>
      <span class="button-copy"><span>${action.label}</span></span>
    </button>
  `;
}

export class ToolbarView {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.contextContainer = null;
  }

  async init() {
    this.container.innerHTML = `
      <div class="toolbar-primary" aria-label="Основное действие">
        <button class="toolbar-button primary" data-action="evaluate" type="button" aria-label="Оценить комнату">
          <span class="button-icon" aria-hidden="true">✦</span>
          <span class="button-copy"><span>Оценить</span></span>
        </button>
      </div>
      <details class="toolbar-more">
        <summary class="toolbar-more-toggle" aria-label="Открыть дополнительные действия и справку">•••</summary>
        <div class="toolbar-menu">
          <button class="toolbar-button quiet-action" data-action="clear" type="button">
            <span class="button-icon" aria-hidden="true">＋</span>
            <span class="button-copy"><span>Новая попытка</span></span>
          </button>
          <details class="help-spoiler" data-help-spoiler>
            <summary>Как играть</summary>
            <div class="help-content">
              <p>Выберите предмет в каталоге, затем разместите его в комнате.</p>
              <ul>
                <li><kbd>R</kbd>/<kbd>Q</kbd> — повернуть</li>
                <li><kbd>Delete</kbd> — удалить выбранный предмет</li>
                <li><kbd>Z</kbd> — отменить последнее действие</li>
                <li><kbd>E</kbd> — оценить комнату</li>
                <li><kbd>Esc</kbd>/<kbd>ПКМ</kbd> — отменить выбор</li>
                <li><kbd>Home</kbd> — вернуть камеру</li>
              </ul>
            </div>
          </details>
        </div>
      </details>
    `;
    this.container.querySelector('[data-action="clear"]').onclick = this.callbacks.onClear;
    this.container.querySelector('[data-action="evaluate"]').onclick = this.callbacks.onEvaluate;
  }

  renderContextActions(container) {
    this.contextContainer = container;
    if (!container) return;
    container.innerHTML = ACTIONS.map(actionMarkup).join('');
    container.querySelector('[data-action="rotate"]').onclick = this.callbacks.onRotate;
    container.querySelector('[data-action="delete"]').onclick = this.callbacks.onDelete;
    container.querySelector('[data-action="undo"]').onclick = this.callbacks.onUndo;
  }

  setSelectionState(selected) {
    for (const action of ['rotate', 'delete']) {
      const button = this.contextContainer?.querySelector(`[data-action="${action}"]`);
      if (button) {
        button.disabled = !selected;
        button.hidden = !selected;
      }
    }
  }

  setUndoState(canUndo, label = null) {
    const button = this.contextContainer?.querySelector('[data-action="undo"]');
    if (!button) return;
    button.disabled = !canUndo;
    button.hidden = !canUndo;
    button.title = canUndo && label ? label : 'Нет действий для отмены';
    button.setAttribute('aria-label', canUndo && label ? label : 'Нет действий для отмены');
  }

  destroy() {
    this.container.replaceChildren();
    this.contextContainer?.replaceChildren();
  }
}
