import { describe, expect, it } from 'vitest';
import { ConstraintEvaluator } from '../../../src/Domain/Constraints/ConstraintEvaluator.js';
import { LinearConstraint } from '../../../src/Domain/Constraints/LinearConstraint.js';
import MultiStyleEvaluator from '../../../src/Domain/Scoring/MultiStyleEvaluator.js';
import { StyleScorer } from '../../../src/Domain/Scoring/StyleScorer.js';

describe('MultiStyleEvaluator', () => {
  it('evaluates each authored target independently and returns a deterministic weighted fit without cross-target penalty duplication', () => {
    const evaluator = new MultiStyleEvaluator({
      constraintEvaluator: new ConstraintEvaluator(),
      styleScorer: new StyleScorer({ maxPenalty: 1, defaultWeight: 1 })
    });
    const targets = Object.freeze([
      Object.freeze({
        styleId: 'scandinavian', role: 'primary', weight: 0.7,
        constraints: Object.freeze([
          new LinearConstraint('woodShare', 'gte', 0.5, 'scand-wood-min', 1, 'scand-wood-low')
        ])
      }),
      Object.freeze({
        styleId: 'japandi', role: 'secondary', weight: 0.3,
        constraints: Object.freeze([
          new LinearConstraint('formSimplicity', 'gte', 0.7, 'japandi-simple-forms', 1, 'japandi-forms-complex')
        ])
      })
    ]);

    const result = evaluator.evaluate({ roomVector: { woodShare: 0.6, formSimplicity: 0.6 }, targets });

    expect(result).toMatchObject({
      weightedTargetFit: 0.97,
      targets: [
        { styleId: 'scandinavian', role: 'primary', weight: 0.7, score: 1, violations: [] },
        {
          styleId: 'japandi', role: 'secondary', weight: 0.3, score: 0.9
        }
      ]
    });
    expect(result.targets[1].violations).toHaveLength(1);
    expect(result.targets[1].violations[0].constraintId).toBe('japandi-simple-forms');
    expect(result.targets[1].violations[0].severity).toBeCloseTo(0.1, 12);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.targets)).toBe(true);
    expect(targets[1].constraints).toHaveLength(1);
  });
});


describe('PROD-023 authored style labels', () => {
  it('preserves a supplied style target label in the immutable per-target score result', () => {
    const evaluator = new MultiStyleEvaluator({
      constraintEvaluator: new ConstraintEvaluator(),
      styleScorer: new StyleScorer({ maxPenalty: 1, defaultWeight: 1 })
    });
    const result = evaluator.evaluate({
      roomVector: { woodShare: 1 },
      targets: [{
        styleId: 'scandinavian',
        label: 'Скандинавский',
        role: 'primary',
        weight: 1,
        constraints: [new LinearConstraint('woodShare', 'gte', 0.5, 'scand-wood-min', 1, 'scand-wood-low')]
      }]
    });

    expect(result.targets[0]).toMatchObject({ styleId: 'scandinavian', label: 'Скандинавский' });
    expect(Object.isFrozen(result.targets[0])).toBe(true);
  });
});
