export class ToolbarView {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  async init() {
    this.container.innerHTML = `
      <button data-action="rotate" disabled>Повернуть <b>R</b></button>
      <button data-action="delete" disabled>Удалить <b>Del</b></button>
      <button data-action="clear">Начать заново</button>
      <button class="primary" data-action="evaluate">Оценить <b>E</b></button>
      <span class="toolbar-hint">Перетаскивайте · R — поворот · PgUp/PgDn — высота · Home — камера · E — оценка</span>
    `;
    this.container.querySelector('[data-action="rotate"]').onclick = this.callbacks.onRotate;
    this.container.querySelector('[data-action="delete"]').onclick = this.callbacks.onDelete;
    this.container.querySelector('[data-action="clear"]').onclick = this.callbacks.onClear;
    this.container.querySelector('[data-action="evaluate"]').onclick = this.callbacks.onEvaluate;
  }

  setSelectionState(selected) {
    for (const action of ['rotate', 'delete']) {
      const button = this.container.querySelector(`[data-action="${action}"]`);
      if (button) button.disabled = !selected;
    }
  }

  destroy() { this.container.replaceChildren(); }
}
