// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
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

  it('does not render an empty sub-score block for legacy evaluation data', () => {
    const container = document.createElement('div');
    const view = new EvaluationView(container);

    view.render({ score: 0.8, stars: 4, violations: [], feedback: [] });

    expect(container.querySelector('[data-score-channel]')).toBeNull();
  });
});
