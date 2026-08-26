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

  it('reveals style criteria and functional schemas before placement when hydrated profiles are provided', () => {
    const container = document.createElement('div');
    const view = new BriefView(container);

    view.render({
      brief: Object.freeze({
        ...brief,
        evaluationPolicy: Object.freeze({
          ergonomicsRules: Object.freeze({
            functionalLayoutRules: Object.freeze([
              Object.freeze({
                id: 'lounge-faces-tv', kind: 'front-adjacency',
                anchorSelector: { affordance: 'lounge-seat' },
                partnerSelector: { affordance: 'view-target' },
                distance: { min: 1, max: 4 }, maxAngleDegrees: 30
              })
            ]),
            requiredFunctionalScenarios: Object.freeze([
              Object.freeze({
                id: 'media', label: 'Медиа-зона', critical: true,
                requiredRoles: Object.freeze([
                  Object.freeze({ affordance: 'lounge-seat', minCount: 1 }),
                  Object.freeze({ affordance: 'view-target', minCount: 1 })
                ])
              })
            ])
          })
        })
      }),
      mode: 'launch',
      levelLabel: 'Гостиная · Первые шаги',
      styleProfiles: [{
        styleId: 'scandinavian', label: 'Скандинавский', role: 'primary', weight: 1,
        constraints: [
          { feature: 'woodShare', operator: 'gte', threshold: 0.5 },
          { feature: 'plasticShare', operator: 'lte', threshold: 0.1 }
        ]
      }]
    });

    expect(container.textContent).toContain('Как организовать пространство');
    expect(container.textContent).toContain('Медиа-зона');
    expect(container.textContent).toContain('Диван или кресло ×1');
    expect(container.textContent).toContain('обязательно для сдачи');
    expect(container.textContent).toContain('фронтально к «ТВ-зона» на расстоянии 1–4 м');
    expect(container.textContent).toContain('развернуть не более чем на 30°');
    expect(container.textContent).toContain('двери и окну должны оставаться свободными');
    expect(container.textContent).toContain('Натуральное дерево — не ниже 50%');
    expect(container.textContent).toContain('Пластик — не выше 10%');
  });
});
