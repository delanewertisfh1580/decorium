import { INPUT_INTENTS, intentFromKeyboardEvent, isEditableTarget } from './InputIntent.js';

export function getKeyboardAction(event) {
  return intentFromKeyboardEvent(event);
}

export function isEditableKeyboardTarget(target) {
  return isEditableTarget(target);
}

export { INPUT_INTENTS };
export default getKeyboardAction;
