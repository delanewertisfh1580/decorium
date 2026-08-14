const freeze = value => Object.freeze(value);

export const INPUT_INTENT_VERSION = 2;

export const INPUT_INTENTS = freeze({
  ROTATE: 'rotate',
  DELETE: 'delete',
  EVALUATE: 'evaluate',
  RAISE: 'raise',
  LOWER: 'lower',
  RESET_CAMERA: 'reset-camera',
  CANCEL: 'cancel',
  UNDO: 'undo'
});

const ACTIONS_BY_CODE = freeze({
  KeyR: INPUT_INTENTS.ROTATE,
  KeyQ: INPUT_INTENTS.ROTATE,
  Delete: INPUT_INTENTS.DELETE,
  Backspace: INPUT_INTENTS.DELETE,
  KeyE: INPUT_INTENTS.EVALUATE,
  PageUp: INPUT_INTENTS.RAISE,
  PageDown: INPUT_INTENTS.LOWER,
  Home: INPUT_INTENTS.RESET_CAMERA,
  Escape: INPUT_INTENTS.CANCEL,
  KeyZ: INPUT_INTENTS.UNDO
});

const ACTIONS_BY_KEY = freeze({
  r: INPUT_INTENTS.ROTATE,
  к: INPUT_INTENTS.ROTATE,
  q: INPUT_INTENTS.ROTATE,
  й: INPUT_INTENTS.ROTATE,
  delete: INPUT_INTENTS.DELETE,
  backspace: INPUT_INTENTS.DELETE,
  e: INPUT_INTENTS.EVALUATE,
  у: INPUT_INTENTS.EVALUATE,
  pageup: INPUT_INTENTS.RAISE,
  pagedown: INPUT_INTENTS.LOWER,
  home: INPUT_INTENTS.RESET_CAMERA,
  escape: INPUT_INTENTS.CANCEL,
  z: INPUT_INTENTS.UNDO,
  я: INPUT_INTENTS.UNDO
});

export function intentFromKeyboardEvent(event) {
  if (!event) return null;
  return ACTIONS_BY_CODE[event.code] ??
    ACTIONS_BY_KEY[String(event.key ?? '').toLowerCase()] ??
    null;
}

export function isEditableTarget(target) {
  return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
}

export default INPUT_INTENTS;
