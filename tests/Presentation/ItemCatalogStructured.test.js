// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { ItemCatalogView } from '../../src/Presentation/Views/ItemCatalogView.js';

const items = [
  { id: 'chair-001', name: 'Кресло Comfort', type: 'chair', dimensions: { x: 0.8, y: 1, z: 0.8 } },
  { id: 'sofa-001', name: 'Диван прямой', type: 'sofa', dimensions: { x: 2, y: 1, z: 0.9 } },
  { id: 'table-001', name: 'Стол обеденный', type: 'table', dimensions: { x: 1.8, y: 0.75, z: 0.9 } },
  { id: 'lamp-001', name: 'Торшер высокий', type: 'lighting', dimensions: { x: 0.4, y: 1.5, z: 0.4 } },
  { id: 'shelf-001', name: 'Шкаф книжный', type: 'storage', dimensions: { x: 1, y: 1.8, z: 0.4 } },
  { id: 'plant-001', name: 'Растение в горшке', type: 'decor', dimensions: { x: 0.3, y: 0.8, z: 0.3 } }
];

function renderedIds(container) {
  return [...container.querySelectorAll('[data-catalog-item-id]')].map(element => element.dataset.catalogItemId);
}

describe('PROD-011 structured catalog', () => {
  it('groups available items through category tabs and reports the filtered result count', () => {
    const container = document.createElement('aside');
    const catalog = new ItemCatalogView(container, vi.fn());

    catalog.render(items);
    container.querySelector('[data-catalog-category="seating"]').click();

    expect(renderedIds(container)).toEqual(['chair-001', 'sofa-001']);
    expect(container.querySelector('[data-catalog-category="seating"]').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-catalog-result-count]').textContent).toBe('2 из 6 предметов');
  });

  it('filters the active category through case-insensitive text search and has an explicit empty state', () => {
    const container = document.createElement('aside');
    const catalog = new ItemCatalogView(container, vi.fn());

    catalog.render(items);
    const search = container.querySelector('[data-catalog-search]');
    search.value = 'КРЕСЛО';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(renderedIds(container)).toEqual(['chair-001']);

    search.value = 'несуществующий предмет';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(container.querySelector('[data-catalog-empty-state]').textContent).toContain('Ничего не найдено');
  });

  it('preserves category, query, selection and vertical scroll position across controller-driven rerender', () => {
    const container = document.createElement('aside');
    const catalog = new ItemCatalogView(container, vi.fn());

    catalog.render(items);
    container.querySelector('[data-catalog-category="seating"]').click();
    const search = container.querySelector('[data-catalog-search]');
    search.value = 'диван';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const grid = container.querySelector('[data-catalog-grid]');
    grid.scrollTop = 73;

    catalog.close();
    catalog.render(items, 'sofa-001');

    expect(container.querySelector('[data-catalog-search]').value).toBe('диван');
    expect(container.querySelector('[data-catalog-category="seating"]').getAttribute('aria-pressed')).toBe('true');
    expect(renderedIds(container)).toEqual(['sofa-001']);
    expect(container.querySelector('[data-catalog-grid]').scrollTop).toBe(73);
    expect(container.querySelector('[data-catalog-item-id="sofa-001"]').classList.contains('selected')).toBe(true);
  });
});
