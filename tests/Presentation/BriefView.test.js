// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { BriefView } from '../../src/Presentation/Views/BriefView.js';

const brief = Object.freeze({
  client: Object.freeze({ displayName: 'Марина и Алексей' }),
  title: 'Гостиная для тёплых ужинов',
  summary: 'Соберите спокойную гостиную, в которой близкие могут удобно поужинать и общаться.',
  clientPriorities: Object.freeze([
    Object.freeze({ id: 'hosting', label: 'Принимать гостей' }),
    Object.freeze({ id: 'entry', label: 'Сохранять свободный вход' })
  ]),
  styleTargets: Object.freeze([
    Object.freeze({ styleId: 'scandinavian', role: 'primary' }),
    Object.freeze({ styleId: 'japandi', role: 'secondary' })
  ])
});

describe('BriefView', () => {
  it('renders a readable launch brief with one clear start action and no evaluation summary', () => {
    const onStartEditing = vi.fn();
    const container = document.createElement('div');
    const view = new BriefView(container, { onStartEditing });

    view.render({ brief, mode: 'launch', levelLabel: 'Гостиная · Первые шаги' });

    expect(container.querySelector('[data-brief-mode="launch"]')).not.toBeNull();
    expect(container.textContent).toContain('Марина и Алексей');
    expect(container.textContent).toContain('Гостиная для тёплых ужинов');
    expect(container.textContent).toContain('Принимать гостей');
    expect(container.textContent).toContain('Скандинавский');
    expect(container.textContent).toContain('Начать оформление');
    expect(container.textContent).not.toContain('Оценка');

    container.querySelector('[data-brief-action="start"]').click();
    expect(onStartEditing).toHaveBeenCalledTimes(1);
  });

  it('renders an in-edit drawer with an explicit close action while preserving authored brief content', () => {
    const onClose = vi.fn();
    const container = document.createElement('div');
    const view = new BriefView(container, { onClose });

    view.render({ brief, mode: 'drawer', levelLabel: 'Гостиная · Первые шаги' });

    expect(container.querySelector('[data-brief-mode="drawer"]')).not.toBeNull();
    expect(container.querySelector('[data-brief-action="close"]')).not.toBeNull();
    expect(container.textContent).toContain('Критерии оценки');
    container.querySelector('[data-brief-action="close"]').click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fails closed for missing authored brief data', () => {
    const container = document.createElement('div');
    const view = new BriefView(container);

    expect(() => view.render({ brief: null, mode: 'launch' })).toThrow('brief');
    expect(() => view.render({ brief, mode: 'unknown' })).toThrow('mode');
  });
});
