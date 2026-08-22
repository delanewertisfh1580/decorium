import { describe, expect, it } from 'vitest';
import { evaluateComposition } from '../../../src/Domain/Scoring/CompositionEvaluator.js';

function itemWithAffordances(affordances, type = 'decor') {
  return {
    type,
    interactionProfile: {
      affordances,
      hasAffordance: affordance => affordances.includes(affordance)
    }
  };
}

describe('composition completeness', () => {
  const rules = {
    minItems: 4,
    requiredAffordances: ['lounge-seat', 'coffee-surface', 'light-source']
  };

  it('does not treat a single authored lounge seat as a completed room', () => {
    const result = evaluateComposition([itemWithAffordances(['lounge-seat'], 'chair')], rules);

    expect(result.complete).toBe(false);
    expect(result.violations.map(violation => violation.messageKey)).toEqual([
      'composition-too-few-items',
      'composition-missing-coffee-surface',
      'composition-missing-light-source'
    ]);
    expect(result.penalty).toBeGreaterThan(0);
  });

  it('accepts an authored semantic composition independently of display type', () => {
    const result = evaluateComposition([
      itemWithAffordances(['lounge-seat'], 'decor'),
      itemWithAffordances(['coffee-surface'], 'decor'),
      itemWithAffordances(['light-source'], 'decor'),
      itemWithAffordances(['floor-decor'], 'decor')
    ], rules);

    expect(result.complete).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.penalty).toBe(0);
    expect(result.affordances).toEqual(['coffee-surface', 'floor-decor', 'light-source', 'lounge-seat']);
  });
});
