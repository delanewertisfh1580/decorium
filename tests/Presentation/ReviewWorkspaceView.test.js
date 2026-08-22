// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { EvaluationView } from '../../src/Presentation/Views/EvaluationView.js';

const result = {
  score: 0.67,
  stars: 3,
  styleScore: 0.8,
  clientPriorityScore: 0.45,
  ergonomicsScore: 0.6,
  violations: [{ id: 'style-issue' }, { id: 'critical-issue' }],
  feedback: ['Начните с критичного требования.'],
  explanation: {
    schemaVersion: 2,
    scorecard: { rawScore: 0.67, rawStars: 3, displayStars: 3, completionEligible: false, completionBlockReason: 'critical-rule' },
    violations: [
      {
        id: 'style-issue', channel: 'style', scope: 'room', rule: { description: 'Добавьте больше светлых поверхностей.' },
        fact: { actual: 0.4, desired: 0.7 }, severity: { level: 'medium', critical: false },
        impact: { totalScoreDelta: 0.05, displayStarsDelta: 0, completionEffect: 'none' }, remediation: 'Выберите более светлую отделку.', instances: []
      },
      {
        id: 'critical-issue', channel: 'ergonomics', scope: 'instances', rule: { description: 'Освободите проход.' },
        fact: { actual: 0.2, desired: 0.8 }, severity: { level: 'high', critical: true },
        impact: { totalScoreDelta: 0.17, displayStarsDelta: 1, completionEffect: 'restores-completion' }, remediation: 'Передвиньте кресло.', instances: [{ instanceId: 'chair-001#1', displayName: 'Кресло' }]
      }
    ]
  }
};

describe('EvaluationView review workspace', () => {
  it('presents completion first and ranks critical repair work before lower-priority issues', () => {
    const container = document.createElement('div');
    const view = new EvaluationView(container);

    view.render(result);

    expect(container.querySelector('[data-review-workspace]')).not.toBeNull();
    expect(container.querySelector('[data-review-hero]')).not.toBeNull();
    expect(container.querySelector('[data-review-issue-list]')).not.toBeNull();
    const issueRows = [...container.querySelectorAll('[data-review-issue]')];
    expect(issueRows.map(row => row.dataset.reviewIssue)).toEqual(['critical-issue', 'style-issue']);
    expect(container.querySelector('[data-review-detail]').textContent).toContain('Освободите проход.');
    expect(container.querySelector('.feedback')).toBeNull();
    expect(container.textContent).toContain('Выполнение заказа заблокировано');
  });

  it('filters ranked issues by supplied channel and forwards focus only for the selected diagnostic', () => {
    const onFocusInstance = vi.fn();
    const container = document.createElement('div');
    const view = new EvaluationView(container, { onFocusInstance });

    view.render(result);
    container.querySelector('[data-review-filter="style"]').click();

    expect([...container.querySelectorAll('[data-review-issue]')].map(row => row.dataset.reviewIssue)).toEqual(['style-issue']);
    expect(container.querySelector('[data-review-detail]').textContent).toContain('Добавьте больше светлых поверхностей.');

    view.render(result);
    container.querySelector('[data-focus-instance="chair-001#1"]').click();
    expect(onFocusInstance).toHaveBeenCalledWith('chair-001#1');
  });
});
