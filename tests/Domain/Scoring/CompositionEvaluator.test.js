import { describe, expect, it } from 'vitest';
import { evaluateComposition } from '../../../src/Domain/Scoring/CompositionEvaluator.js';

describe('composition completeness', () => {
  const rules = {
    minItems: 4,
    requiredRoles: ['seating', 'surface', 'lighting']
  };

  it('does not treat a single chair as a completed room', () => {
    const result = evaluateComposition([{ type: 'chair' }], rules);

    expect(result.complete).toBe(false);
    expect(result.violations.map(violation => violation.messageKey)).toEqual([
      'composition-too-few-items',
      'composition-missing-surface',
      'composition-missing-lighting'
    ]);
    expect(result.penalty).toBeGreaterThan(0);
  });

  it('accepts a minimal living-room composition with required roles', () => {
    const result = evaluateComposition([
      { type: 'sofa' },
      { type: 'table' },
      { type: 'lighting' },
      { type: 'decor' }
    ], rules);

    expect(result.complete).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.penalty).toBe(0);
  });
});
