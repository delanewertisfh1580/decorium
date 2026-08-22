// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import MainMenuView from '../../src/Presentation/Views/MainMenuView.js';

const levels = [
  { id: 'level-001', name: 'Первые шаги', description: 'Освойте основу композиции.', sortOrder: 1, isUnlocked: true, bestStars: 3 },
  { id: 'level-002', name: 'Уютный уголок', description: 'Соберите зону отдыха.', sortOrder: 2, isUnlocked: false, bestStars: null }
];

function createView(container) {
  const callbacks = {
    onContinue: vi.fn(), onCampaign: vi.fn(), onEndless: vi.fn(), onBack: vi.fn(), onSelectLevel: vi.fn(), onStartEndless: vi.fn()
  };
  return { callbacks, view: new MainMenuView(container, callbacks) };
}

describe('MainMenuView', () => {
  it('renders campaign progression with locked content inaccessible and active best score visible', () => {
    const container = document.createElement('aside');
    const { view, callbacks } = createView(container);

    view.render({ screen: 'campaign', campaignLevels: levels, activeLevelId: 'level-001', profile: { progress: { completedLevels: {} } } });

    const unlocked = container.querySelector('[data-level-id="level-001"]');
    const locked = container.querySelector('[data-level-id="level-002"]');
    expect(unlocked.textContent).toContain('3★');
    expect(unlocked.classList.contains('is-active')).toBe(true);
    expect(locked.disabled).toBe(true);
    expect(locked.getAttribute('aria-disabled')).toBe('true');
    unlocked.click();
    locked.click();
    expect(callbacks.onSelectLevel).toHaveBeenCalledWith('level-001');
    expect(callbacks.onSelectLevel).toHaveBeenCalledTimes(1);
  });

  it('routes explicit generated-run actions and retains repeat seed affordance only when a seed exists', () => {
    const container = document.createElement('aside');
    const { view, callbacks } = createView(container);

    view.render({ screen: 'endless', endlessSeed: 42 });

    expect(container.textContent).toContain('42');
    container.querySelector('[data-menu-action="new-endless"]').click();
    container.querySelector('[data-menu-action="repeat-endless"]').click();
    expect(callbacks.onStartEndless).toHaveBeenNthCalledWith(1, null);
    expect(callbacks.onStartEndless).toHaveBeenNthCalledWith(2, 42);
  });
});
