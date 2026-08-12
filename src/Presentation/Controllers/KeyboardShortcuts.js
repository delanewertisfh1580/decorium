const KEYBOARD_ACTIONS_BY_CODE = {
  KeyR: 'rotate',
  Delete: 'delete',
  Backspace: 'delete',
  KeyE: 'evaluate',
  PageUp: 'raise',
  PageDown: 'lower',
  Home: 'reset-camera',
  Escape: 'cancel'
};

const KEYBOARD_ACTIONS_BY_KEY = {
  r: 'rotate',
  к: 'rotate',
  delete: 'delete',
  backspace: 'delete',
  e: 'evaluate',
  у: 'evaluate',
  pageup: 'raise',
  pagedown: 'lower',
  home: 'reset-camera',
  escape: 'cancel'
};

/**
 * Keyboard shortcuts use event.code first so they work with any keyboard layout.
 * The key fallback keeps the helper usable with synthetic events and older browsers.
 */
export function getKeyboardAction(event) {
  if (!event) return null;
  return KEYBOARD_ACTIONS_BY_CODE[event.code] ??
    KEYBOARD_ACTIONS_BY_KEY[String(event.key ?? '').toLowerCase()] ??
    null;
}

export function isEditableKeyboardTarget(target) {
  return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
}

export default getKeyboardAction;
