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
});
