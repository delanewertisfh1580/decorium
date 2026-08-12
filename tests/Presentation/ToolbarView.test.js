// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { ToolbarView } from '../../src/Presentation/Views/ToolbarView.js';

describe('UI-VIS-002 compact contextual actions', () => {
  it('keeps item actions out of the persistent bottom dock', async () => {
    const dock = document.createElement('div');
    const callbacks = {
      onRotate: vi.fn(),
      onDelete: vi.fn(),
      onUndo: vi.fn(),
      onClear: vi.fn(),
      onEvaluate: vi.fn()
    };
    const toolbar = new ToolbarView(dock, callbacks);

    await toolbar.init();

    expect(dock.querySelector('[data-action="rotate"]')).toBeNull();
    expect(dock.querySelector('[data-action="delete"]')).toBeNull();
    expect(dock.querySelector('[data-action="undo"]')).toBeNull();
    expect(dock.querySelector('[data-action="clear"]')).not.toBeNull();
    expect(dock.querySelector('[data-action="evaluate"]')).not.toBeNull();
  });

  it('renders and controls item actions inside the summary spoiler', async () => {
    const dock = document.createElement('div');
    const summary = document.createElement('div');
    const callbacks = { onRotate: vi.fn(), onDelete: vi.fn(), onUndo: vi.fn(), onClear: vi.fn(), onEvaluate: vi.fn() };
    const toolbar = new ToolbarView(dock, callbacks);

    await toolbar.init();
    toolbar.renderContextActions(summary);
    toolbar.setSelectionState(true);
    toolbar.setUndoState(true, 'Отменить размещение');

    expect(summary.querySelectorAll('[data-action]').length).toBe(3);
    expect(summary.querySelector('[data-action="rotate"]').disabled).toBe(false);
    expect(summary.querySelector('[data-action="delete"]').disabled).toBe(false);
    expect(summary.querySelector('[data-action="undo"]').title).toBe('Отменить размещение');
  });
});
