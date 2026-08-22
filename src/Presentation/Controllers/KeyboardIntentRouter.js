import { getKeyboardAction, isEditableKeyboardTarget } from './KeyboardShortcuts.js';

export class KeyboardIntentRouter {
  constructor({ target = document, dispatch } = {}) {
    if (!target?.addEventListener || !target?.removeEventListener) {
      throw new Error('KeyboardIntentRouter: an event target is required.');
    }
    if (typeof dispatch !== 'function') {
      throw new Error('KeyboardIntentRouter: dispatch is required.');
    }
    this.target = target;
    this.dispatch = dispatch;
    this._started = false;
  }

  start() {
    if (this._started) return;
    this.target.addEventListener('keydown', this._onKeyDown, true);
    this._started = true;
  }

  destroy() {
    if (!this._started) return;
    this.target.removeEventListener('keydown', this._onKeyDown, true);
    this._started = false;
  }

  _onKeyDown = event => {
    if (isEditableKeyboardTarget(event.target)) return;
    const intent = getKeyboardAction(event);
    if (!intent) return;
    event.preventDefault();
    this.dispatch(intent);
  };
}

export default KeyboardIntentRouter;
