export class TransientStatusView {
  constructor(container, { defaultDurationMs = 2600 } = {}) {
    this.container = container ?? null;
    this.defaultDurationMs = defaultDurationMs;
    this._timer = null;
  }

  show(message, durationMs = this.defaultDurationMs) {
    if (!this.container) return;
    this.container.textContent = message;
    this.container.classList.remove('hidden');
    this._clearTimer();
    this._timer = setTimeout(() => this.hide(), durationMs);
  }

  hide() {
    if (!this.container) return;
    this._clearTimer();
    this.container.classList.add('hidden');
  }

  destroy() {
    this._clearTimer();
    this.container = null;
  }

  _clearTimer() {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}

export default TransientStatusView;
