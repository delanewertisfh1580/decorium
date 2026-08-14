// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import LevelSelectView from '../../src/Presentation/Views/LevelSelectView.js';

const levels = [
  {
    id: 'level-001', name: 'Первые шаги', description: 'Освойте основу композиции.', sortOrder: 1,
    prerequisiteLevelId: null, isUnlocked: true, bestStars: 3
  },
  {
    id: 'level-002', name: 'Уютный уголок', description: 'Соберите зону отдыха.', sortOrder: 2,
    prerequisiteLevelId: 'level-001', isUnlocked: false, bestStars: null
  }
];

describe('LevelSelectView progression', () => {
  it('renders a progress cue for completed levels and a disabled accessible state for locked content', () => {
    const onLevelSelected = vi.fn();
    const container = document.createElement('aside');
    const view = new LevelSelectView(container, onLevelSelected);

    view.render(levels, 'level-001');

    const completed = container.querySelector('[data-level-id="level-001"]');
    const locked = container.querySelector('[data-level-id="level-002"]');
    expect(completed.textContent).toContain('3★');
    expect(locked.disabled).toBe(true);
    expect(locked.getAttribute('aria-disabled')).toBe('true');
    expect(locked.textContent).toContain('Открывается после');

    locked.click();
    expect(onLevelSelected).not.toHaveBeenCalled();
  });
});
