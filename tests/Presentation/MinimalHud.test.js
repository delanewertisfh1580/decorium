// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { ItemCatalogView } from '../../src/Presentation/Views/ItemCatalogView.js';
import { ToolbarView } from '../../src/Presentation/Views/ToolbarView.js';

describe('UI-VIS-004 minimal contextual HUD', () => {
  const item = {
    id: 'chair-001',
    name: 'Кресло',
    type: 'chair',
    dimensions: { x: 0.8, y: 1, z: 0.8 }
  };

  it('keeps the catalog collapsed until the player asks for it', () => {
    const container = document.createElement('aside');
    const catalog = new ItemCatalogView(container, vi.fn());

    catalog.render([item]);

    const spoiler = container.querySelector('[data-catalog-spoiler]');
    expect(spoiler).not.toBeNull();
    expect(spoiler.open).toBe(false);
    expect(container.querySelector('.catalog-subtitle')).toBeNull();
    expect(container.querySelector('.item-card')).not.toBeNull();
  });

  it('remembers an explicitly opened catalog across re-render', () => {
    const container = document.createElement('aside');
    const catalog = new ItemCatalogView(container, vi.fn());

    catalog.render([item]);
    const spoiler = container.querySelector('[data-catalog-spoiler]');
    spoiler.open = true;
    spoiler.dispatchEvent(new Event('toggle'));
    catalog.render([item], item.id);

    expect(container.querySelector('[data-catalog-spoiler]').open).toBe(true);
    expect(container.querySelector('.item-card.selected')).not.toBeNull();
  });

  it('puts help and reset under the secondary toolbar spoiler', async () => {
    const container = document.createElement('header');
    const callbacks = {
      onRotate: vi.fn(), onDelete: vi.fn(), onUndo: vi.fn(),
      onClear: vi.fn(), onEvaluate: vi.fn()
    };
    const toolbar = new ToolbarView(container, callbacks);

    await toolbar.init();

    expect(container.querySelector('[data-action="evaluate"]')).not.toBeNull();
    expect(container.querySelector('[data-action="clear"]')).not.toBeNull();
    expect(container.querySelector('[data-action="clear"]').closest('details')).not.toBeNull();
    expect(container.querySelector('[data-help-spoiler]')).not.toBeNull();
    expect(container.querySelector('[data-help-spoiler]').open).toBe(false);
    expect(container.querySelector('[data-help-spoiler] kbd')).not.toBeNull();
  });
});
