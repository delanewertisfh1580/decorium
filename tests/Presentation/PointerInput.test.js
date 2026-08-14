import { describe, expect, it } from 'vitest';
import { isPrimaryInteractionPointer } from '../../src/Presentation/Views/RoomView.js';

describe('pointer input contract', () => {
  it('accepts a primary touch as a game interaction even when it has no mouse button value', () => {
    expect(isPrimaryInteractionPointer({ pointerType: 'touch', isPrimary: true, button: -1 })).toBe(true);
  });

  it('keeps mouse primary-button semantics and rejects secondary/non-primary interactions', () => {
    expect(isPrimaryInteractionPointer({ pointerType: 'mouse', button: 0 })).toBe(true);
    expect(isPrimaryInteractionPointer({ pointerType: 'mouse', button: 2 })).toBe(false);
    expect(isPrimaryInteractionPointer({ pointerType: 'touch', isPrimary: false, button: 0 })).toBe(false);
  });
});
