// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import LevelSummary from '../../src/Domain/Levels/LevelSummary.js';
import LevelSelectView from '../../src/Presentation/Views/LevelSelectView.js';

const levels = [
  new LevelSummary({ id: 'level-001', name: 'Первые шаги', description: 'Освойте основу композиции.', sortOrder: 1 }),
  new LevelSummary({ id: 'level-002', name: 'Уютный уголок', description: 'Соберите зону отдыха.', sortOrder: 2 })
];

describe('LevelSelectView', () => {
  it('renders a concise accessible authored-level selector with the active level marked', () => {
    const container = document.createElement('aside');
    const view = new LevelSelectView(container, vi.fn());

    view.render(levels, 'level-001');

    const selector = container.querySelector('[data-level-select]');
    expect(selector).not.toBeNull();
    expect(selector.querySelectorAll('[data-level-id]')).toHaveLength(2);
    expect(selector.querySelector('[data-level-id="level-001"]').getAttribute('aria-current')).toBe('true');
    expect(selector.textContent).toContain('Уютный уголок');
  });

  it('notifies Presentation orchestration after the player selects another authored level', () => {
    const onLevelSelected = vi.fn();
    const container = document.createElement('aside');
    const view = new LevelSelectView(container, onLevelSelected);
    view.render(levels, 'level-001');

    container.querySelector('[data-level-id="level-002"]').click();

    expect(onLevelSelected).toHaveBeenCalledWith('level-002');
  });
});
