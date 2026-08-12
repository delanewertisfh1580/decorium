import { describe, expect, it } from 'vitest';
import { getKeyboardAction, isEditableKeyboardTarget } from '../../src/Presentation/Controllers/KeyboardShortcuts.js';

describe('KeyboardShortcuts', () => {
  it('uses physical key codes so shortcuts work with a Cyrillic layout', () => {
    expect(getKeyboardAction({ code: 'KeyR', key: 'к' })).toBe('rotate');
    expect(getKeyboardAction({ code: 'KeyE', key: 'у' })).toBe('evaluate');
  });

  it('supports the movement and scene control keys', () => {
    expect(getKeyboardAction({ code: 'PageUp' })).toBe('raise');
    expect(getKeyboardAction({ code: 'PageDown' })).toBe('lower');
    expect(getKeyboardAction({ code: 'Home' })).toBe('reset-camera');
    expect(getKeyboardAction({ code: 'Escape' })).toBe('cancel');
    expect(getKeyboardAction({ key: 'Delete' })).toBe('delete');
  });

  it('does not classify unrelated keys as game commands', () => {
    expect(getKeyboardAction({ code: 'KeyW', key: 'ц' })).toBeNull();
  });

  it('recognizes editable targets for text input protection', () => {
    const input = { closest: selector => selector.includes('input') ? input : null };
    const canvas = { closest: () => null };
    expect(isEditableKeyboardTarget(input)).toBe(true);
    expect(isEditableKeyboardTarget(canvas)).toBe(false);
  });
});
