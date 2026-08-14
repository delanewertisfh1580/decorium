// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { ToolbarView } from '../../src/Presentation/Views/ToolbarView.js';

describe('ToolbarView touch-equivalent actions', () => {
  it('exposes raise, lower and camera reset controls for paths previously available only from keyboard', async () => {
    const dock = document.createElement('div');
    const summary = document.createElement('div');
    const callbacks = {
      onRotate: vi.fn(), onDelete: vi.fn(), onUndo: vi.fn(), onClear: vi.fn(), onEvaluate: vi.fn(),
      onRaise: vi.fn(), onLower: vi.fn(), onResetCamera: vi.fn()
    };
    const toolbar = new ToolbarView(dock, callbacks);

    await toolbar.init();
    toolbar.renderContextActions(summary);
    toolbar.setSelectionState(true);

    const raise = summary.querySelector('[data-action="raise"]');
    const lower = summary.querySelector('[data-action="lower"]');
    const resetCamera = dock.querySelector('[data-action="reset-camera"]');
    expect(raise).not.toBeNull();
    expect(lower).not.toBeNull();
    expect(resetCamera).not.toBeNull();
    expect(raise.getAttribute('aria-label')).toContain('Поднять');
    expect(lower.getAttribute('aria-label')).toContain('Опустить');

    raise.click();
    lower.click();
    resetCamera.click();
    expect(callbacks.onRaise).toHaveBeenCalledTimes(1);
    expect(callbacks.onLower).toHaveBeenCalledTimes(1);
    expect(callbacks.onResetCamera).toHaveBeenCalledTimes(1);
  });
});
