// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import DesignInspectorView from '../../src/Presentation/Views/DesignInspectorView.js';

const roomState = {
  getItem: vi.fn(() => ({
    id: 'sofa-001#1',
    item: {
      name: 'Диван прямой',
      baseVariantId: 'base',
      variants: [{ id: 'base', label: 'Базовый', unlockId: 'starter', visual: { color: '#123456', materialId: 'textile' } }]
    },
    configuration: { variantId: 'base' }
  })),
  surfaceConfiguration: { floorFinishId: 'oak', wallFinishId: 'linen' }
};

const finishes = [
  { id: 'oak', label: 'Светлый дуб', surface: 'floor', unlockId: 'starter', visual: { color: '#d9c59b' } },
  { id: 'linen', label: 'Тёплая штукатурка', surface: 'wall', unlockId: 'starter', visual: { color: '#eee6d5' } }
];

describe('Contextual DesignInspectorView', () => {
  it('renders selected item controls in the inspector rather than the score summary', async () => {
    const onRotate = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const container = document.createElement('div');
    const view = new DesignInspectorView(container, { onRotate, onDelete, onClose });
    await view.init();

    view.render({ roomState, selectedItemId: 'sofa-001#1', surfaceFinishes: finishes, unlockedIds: ['starter'] });

    expect(container.querySelector('[data-contextual-inspector]')).not.toBeNull();
    expect(container.textContent).toContain('Диван прямой');
    expect(container.querySelector('[data-inspector-action="rotate"]')).not.toBeNull();
    expect(container.querySelector('[data-inspector-action="delete"]')).not.toBeNull();
    expect(container.querySelector('details')).toBeNull();
    container.querySelector('[data-inspector-action="rotate"]').click();
    container.querySelector('[data-inspector-action="delete"]').click();
    container.querySelector('[data-inspector-action="close"]').click();
    expect(onRotate).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps room surfaces available in explicit room context when no item is selected', async () => {
    const container = document.createElement('div');
    const view = new DesignInspectorView(container);
    await view.init();

    view.render({ roomState, selectedItemId: null, surfaceFinishes: finishes, unlockedIds: ['starter'] });

    expect(container.textContent).toContain('Настройка комнаты');
    expect(container.textContent).toContain('Светлый дуб');
    expect(container.querySelector('[data-inspector-action="rotate"]')).toBeNull();
  });
});
