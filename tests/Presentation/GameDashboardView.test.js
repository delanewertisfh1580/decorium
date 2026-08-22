// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { GameDashboardView } from '../../src/Presentation/Views/GameDashboardView.js';

describe('GameDashboardView', () => {
  function clientBrief() {
    return {
      client: { displayName: 'Марина и Алексей' },
      title: 'Гостиная для ужинов',
      summary: 'Тёплая семейная гостиная.',
      clientPriorities: [{ id: 'hosting', label: 'Принимать гостей' }]
    };
  }

  it('renders room summary, supplied evaluation data, client brief and context actions', () => {
    const container = document.createElement('div');
    const renderContextActions = vi.fn(target => {
      target.innerHTML = '<button data-action="rotate">Повернуть</button>';
    });
    const view = new GameDashboardView(container, { renderContextActions });

    view.render({
      roomName: 'Гостиная: Первые шаги',
      placedCount: 3,
      evaluation: { score: 0.82, stars: 4 },
      clientBrief: clientBrief()
    });

    expect(container.textContent).toContain('Гостиная: Первые шаги');
    expect(container.textContent).toContain('82');
    expect(container.querySelector('.stars').getAttribute('aria-label')).toBe('4 из 5 звёзд');
    expect(container.textContent).toContain('Марина и Алексей');
    expect(container.textContent).toContain('Принимать гостей');
    expect(renderContextActions).toHaveBeenCalledWith(container.querySelector('[data-context-actions]'));
    expect(container.querySelector('[data-action="rotate"]')).not.toBeNull();
  });

  it('keeps the dashboard disclosure open across rerenders', () => {
    const container = document.createElement('div');
    const view = new GameDashboardView(container);

    view.render({ roomName: 'Комната', placedCount: 0 });
    const spoiler = container.querySelector('[data-dashboard-spoiler]');
    spoiler.open = true;
    spoiler.dispatchEvent(new Event('toggle'));
    view.render({ roomName: 'Комната', placedCount: 1 });

    expect(container.querySelector('[data-dashboard-spoiler]').open).toBe(true);
  });

  it('renders an unevaluated placeholder without inventing an evaluation result', () => {
    const container = document.createElement('div');
    const view = new GameDashboardView(container);

    view.render({ roomName: 'Комната', placedCount: 0 });

    expect(container.querySelector('.score-value').textContent).toBe('—');
    expect(container.querySelector('.stars').textContent).toBe('☆☆☆☆☆');
  });
});
