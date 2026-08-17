// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { EvaluationView } from '../../src/Presentation/Views/EvaluationView.js';

describe('EvaluationView ergonomics sub-scores', () => {
  it('renders labelled style and ergonomics score channels when production data is available', () => {
    const container = document.createElement('div');
    const view = new EvaluationView(container);

    view.render({
      score: 0.82,
      stars: 4,
      styleScore: 0.9,
      ergonomicsScore: 0.63,
      scoreWeights: { style: 0.7, ergonomics: 0.3 },
      violations: [{ type: 'ergonomics' }],
      feedback: ['Оставьте больше прохода между предметами.']
    });

    expect(container.querySelector('[data-score-channel="style"]').textContent).toContain('90');
    expect(container.querySelector('[data-score-channel="ergonomics"]').textContent).toContain('63');
    expect(container.textContent).toContain('Стиль');
    expect(container.textContent).toContain('Эргономика');
  });

  it('renders functional dining guidance through the existing feedback surface', () => {
    const container = document.createElement('div');
    const view = new EvaluationView(container);

    view.render({
      score: 0.72,
      stars: 3,
      styleScore: 0.9,
      ergonomicsScore: 0.3,
      violations: [{ type: 'ergonomics', feature: 'functionalLayout' }],
      feedback: ['Добавьте места для сидения у обеденного стола.']
    });

    expect(container.querySelector('.feedback').textContent).toContain('Добавьте места для сидения у обеденного стола.');
    expect(container.textContent).toContain('1 подсказок для следующей попытки');
  });

  it('renders a calibrated explainability card and delegates instance focus without computing policy', () => {
    const container = document.createElement('div');
    const onFocusInstance = vi.fn();
    const view = new EvaluationView(container, { onFocusInstance });

    view.render({
      score: 0.85,
      stars: 2,
      styleScore: 1,
      ergonomicsScore: 0.5,
      violations: [{ id: 'ergonomics-minimum-clearance:item-001' }],
      feedback: [],
      explanation: {
        schemaVersion: 1,
        scorecard: {
          rawScore: 0.85,
          rawStars: 4,
          displayStars: 2,
          completionEligible: false,
          completionBlockReason: 'critical-rule'
        },
        violations: [{
          id: 'ergonomics-minimum-clearance:item-001',
          channel: 'ergonomics',
          scope: 'instances',
          rule: { messageKey: 'ergonomics-minimum-clearance', description: 'Сохраните проход свободным.' },
          fact: { operator: 'gte', actual: 0.3, desired: 0.8 },
          severity: { level: 'high', value: 0.7, critical: false },
          impact: { channelScoreDelta: 0.5, totalScoreDelta: 0.15, displayStarsDelta: 1, completionEffect: 'none' },
          remediation: 'Оставьте больше прохода между предметами.',
          instances: [{ instanceId: 'item-001', itemId: 'chair-001', displayName: 'Кресло' }]
        }, {
          id: 'required-scenario:work',
          channel: 'ergonomics',
          scope: 'room',
          rule: { messageKey: 'scenario-focused-work-required', description: 'Нужна рабочая зона.' },
          fact: { operator: 'gte', actual: 0, desired: 1 },
          severity: { level: 'critical', value: 1, critical: true },
          impact: { channelScoreDelta: 0.2, totalScoreDelta: 0.06, displayStarsDelta: 0, completionEffect: 'none' },
          remediation: 'Добавьте стол и место для работы.',
          instances: []
        }]
      }
    });

    expect(container.querySelector('[data-completion-status="blocked"]')).not.toBeNull();
    expect(container.querySelector('[data-explanation-list]')).not.toBeNull();
    expect(container.querySelector('[data-violation-id="ergonomics-minimum-clearance:item-001"]').textContent).toContain('Фактически');
    expect(container.textContent).toContain('Требуется');
    expect(container.textContent).toContain('Улучшение при исправлении');
    expect(container.textContent).toContain('Оставьте больше прохода между предметами.');
    expect(container.querySelector('[data-violation-id="required-scenario:work"]').textContent).toContain('Нет размещённых предметов для выбора.');

    container.querySelector('[data-focus-instance="item-001"]').click();
    expect(onFocusInstance).toHaveBeenCalledWith('item-001');
  });

  it('does not render an empty sub-score block for legacy evaluation data', () => {
    const container = document.createElement('div');
    const view = new EvaluationView(container);

    view.render({ score: 0.8, stars: 4, violations: [], feedback: [] });

    expect(container.querySelector('[data-score-channel]')).toBeNull();
  });
});


describe('PROD-023 multi-style evaluation view', () => {
  it('renders three supplied score channels and a V2 client-priority explanation without evaluating policy in UI', () => {
    const container = document.createElement('div');
    const view = new EvaluationView(container);

    view.render({
      score: 0.73,
      stars: 4,
      styleScore: 0.7,
      clientPriorityScore: 0.5,
      ergonomicsScore: 0.9,
      scoreWeights: { style: 0.5, clientPriorities: 0.2, ergonomics: 0.3 },
      scoreBreakdown: {
        schemaVersion: 1,
        style: {
          targets: [
            { styleId: 'scandinavian', label: 'Скандинавский', role: 'primary', weight: 0.7, score: 0.9 },
            { styleId: 'japandi', label: 'Japandi', role: 'secondary', weight: 0.2, score: 0.6 }
          ]
        }
      },
      violations: [{ id: 'client-priority:warm-intimacy', type: 'client-priority' }],
      feedback: [],
      explanation: {
        schemaVersion: 2,
        scorecard: { rawScore: 0.73, rawStars: 4, displayStars: 4, completionEligible: true, completionBlockReason: null },
        violations: [{
          id: 'client-priority:warm-intimacy',
          channel: 'client-priority',
          scope: 'room',
          priority: { id: 'warm-intimacy', label: 'Камерная атмосфера', ruleKind: 'spatial-preferences' },
          rule: { messageKey: 'priority-warm-intimacy', description: 'Камерная атмосфера' },
          fact: { operator: 'gte', actual: 0.5, desired: 1 },
          severity: { level: 'medium', value: 0.5, critical: false },
          impact: { channelScoreDelta: 0.5, totalScoreDelta: 0.1, displayStarsDelta: 0, completionEffect: 'none' },
          remediation: 'Сделайте пространство более собранным.',
          instances: []
        }]
      }
    });

    expect(container.querySelector('[data-score-channel="client-priority"]')).not.toBeNull();
    expect(container.textContent).toContain('Запросы клиента');
    expect(container.textContent).toContain('Скандинавский');
    expect(container.textContent).toContain('Japandi');
    expect(container.querySelector('[data-violation-id="client-priority:warm-intimacy"]').textContent).toContain('Камерная атмосфера');
    expect(container.textContent).toContain('Сделайте пространство более собранным.');
  });
});
