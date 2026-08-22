// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { INPUT_INTENTS } from '../../src/Presentation/Controllers/InputIntent.js';
import { KeyboardIntentRouter } from '../../src/Presentation/Controllers/KeyboardIntentRouter.js';

function keyDown({ code, key, target = document.body } = {}) {
  const event = new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('KeyboardIntentRouter', () => {
  it('dispatches normalized game intents and prevents browser defaults', () => {
    const dispatch = vi.fn();
    const router = new KeyboardIntentRouter({ target: document, dispatch });
    router.start();

    const event = keyDown({ code: 'KeyR', key: 'к' });

    expect(dispatch).toHaveBeenCalledWith(INPUT_INTENTS.ROTATE);
    expect(event.defaultPrevented).toBe(true);
    router.destroy();
  });

  it('does not intercept typing in editable controls', () => {
    const dispatch = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    const router = new KeyboardIntentRouter({ target: document, dispatch });
    router.start();

    const event = keyDown({ code: 'KeyE', key: 'e', target: input });

    expect(dispatch).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    router.destroy();
    input.remove();
  });

  it('starts only one listener and tears it down completely', () => {
    const dispatch = vi.fn();
    const router = new KeyboardIntentRouter({ target: document, dispatch });
    router.start();
    router.start();

    keyDown({ code: 'KeyZ', key: 'z' });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(INPUT_INTENTS.UNDO);

    router.destroy();
    keyDown({ code: 'KeyZ', key: 'z' });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('rejects incomplete construction contracts', () => {
    expect(() => new KeyboardIntentRouter({ target: {}, dispatch: () => {} })).toThrow('event target is required');
    expect(() => new KeyboardIntentRouter({ target: document })).toThrow('dispatch is required');
  });
});
