import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const feedback = JSON.parse(readFileSync(
  new URL('../../data/feedback/scandinavian-feedback.json', import.meta.url),
  'utf8'
));

describe('functional layout feedback content', () => {
  it('provides a player-actionable message for missing dining seats', () => {
    expect(feedback).toContainEqual({
      id: 'functional-dining-seat-required',
      category: 'violation',
      template: 'Добавьте места для сидения у обеденного стола.',
      severity: 'high'
    });
  });

  it('provides client-actionable guidance for missing dining, media and work scenarios', () => {
    expect(feedback).toContainEqual({
      id: 'scenario-dining-hosting-required',
      category: 'violation',
      template: 'Соберите обеденную группу: добавьте стол и два места для сидения.',
      severity: 'high'
    });
    expect(feedback).toContainEqual({
      id: 'scenario-evening-media-required',
      category: 'violation',
      template: 'Соберите медиа-зону: добавьте место для отдыха, телевизор и журнальный столик.',
      severity: 'high'
    });
    expect(feedback).toContainEqual({
      id: 'scenario-focused-work-required',
      category: 'violation',
      template: 'Соберите рабочее место: добавьте письменный стол и место для работы.',
      severity: 'high'
    });
  });

  it('provides actionable lounge orientation guidance for TV and coffee-table relations', () => {
    expect(feedback).toContainEqual({
      id: 'functional-lounge-faces-view-target',
      category: 'violation',
      template: 'Поверните диван к телевизору, чтобы зона отдыха работала как единый сценарий.',
      severity: 'high'
    });
    expect(feedback).toContainEqual({
      id: 'functional-coffee-surface-in-front-of-lounge-seat',
      category: 'violation',
      template: 'Поставьте журнальный столик перед диваном, оставив удобное расстояние.',
      severity: 'medium'
    });
  });
});
