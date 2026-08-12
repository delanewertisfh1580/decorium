import { describe, expect, it } from 'vitest';
import { INPUT_INTENTS, intentFromKeyboardEvent, isEditableTarget } from '../../src/Presentation/Controllers/InputIntent.js';

describe('UI-CTRL-001 input intents', () => {
  it('maps physical PC keys independently of keyboard layout', () => {
    expect(intentFromKeyboardEvent({ code: 'KeyR', key: 'к' })).toBe(INPUT_INTENTS.ROTATE);
    expect(intentFromKeyboardEvent({ code: 'KeyQ', key: 'й' })).toBe(INPUT_INTENTS.ROTATE);
    expect(intentFromKeyboardEvent({ code: 'KeyZ', key: 'я' })).toBe(INPUT_INTENTS.UNDO);
    expect(intentFromKeyboardEvent({ code: 'KeyE', key: 'у' })).toBe(INPUT_INTENTS.EVALUATE);
  });

  it('maps deletion, movement and scene controls', () => {
    expect(intentFromKeyboardEvent({ code: 'Delete' })).toBe(INPUT_INTENTS.DELETE);
    expect(intentFromKeyboardEvent({ code: 'PageUp' })).toBe(INPUT_INTENTS.RAISE);
    expect(intentFromKeyboardEvent({ code: 'PageDown' })).toBe(INPUT_INTENTS.LOWER);
    expect(intentFromKeyboardEvent({ code: 'Home' })).toBe(INPUT_INTENTS.RESET_CAMERA);
    expect(intentFromKeyboardEvent({ code: 'Escape' })).toBe(INPUT_INTENTS.CANCEL);
    expect(intentFromKeyboardEvent({ code: 'KeyW' })).toBeNull();
  });

  it('does not treat editable controls as gameplay targets', () => {
    const input = { closest: selector => selector.includes('input') ? input : null };
    const canvas = { closest: () => null };
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(canvas)).toBe(false);
  });
});
