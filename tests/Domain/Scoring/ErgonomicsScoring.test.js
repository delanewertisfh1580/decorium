import { describe, expect, it } from 'vitest';
import ErgonomicsScorer from '../../../src/Domain/Scoring/ErgonomicsScorer.js';
import EvaluationScoreAggregator from '../../../src/Domain/Scoring/EvaluationScoreAggregator.js';

const violation = Object.freeze({
  severity: 0.5,
  constraint: { weight: 0.6 }
});

describe('ErgonomicsScorer', () => {
  it('normalizes weighted ergonomics penalty with an exponential score curve', () => {
    const result = new ErgonomicsScorer({ maxPenalty: 1, defaultWeight: 1 }).evaluate([violation]);

    expect(result.penalty).toBeCloseTo(0.3, 5);
    expect(result.score).toBeCloseTo(Math.exp(-0.3), 5);
    expect(result.violations).toEqual([violation]);
  });

  it('caps accumulated penalties before scoring', () => {
    const scorer = new ErgonomicsScorer({ maxPenalty: 1, defaultWeight: 1 });

    expect(scorer.evaluate([{ severity: 1, constraint: { weight: 5 } }]).score).toBeCloseTo(Math.exp(-1), 5);
  });
});

describe('EvaluationScoreAggregator', () => {
  it('combines style and ergonomics sub-scores using explicit normalized weights', () => {
    const aggregator = new EvaluationScoreAggregator({ styleWeight: 0.7, ergonomicsWeight: 0.3 });

    expect(aggregator.aggregate({ styleScore: 0.8, ergonomicsScore: 0.5 })).toEqual({
      totalScore: 0.71,
      styleWeight: 0.7,
      ergonomicsWeight: 0.3
    });
  });

  it('rejects invalid scores and an empty weight model', () => {
    expect(() => new EvaluationScoreAggregator({ styleWeight: 0, ergonomicsWeight: 0 })).toThrow('weight');
    const aggregator = new EvaluationScoreAggregator({ styleWeight: 1, ergonomicsWeight: 1 });
    expect(() => aggregator.aggregate({ styleScore: 1.1, ergonomicsScore: 0.5 })).toThrow('styleScore');
  });
});
