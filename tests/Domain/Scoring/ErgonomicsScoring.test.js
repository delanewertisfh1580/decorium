import { describe, expect, it } from 'vitest';
import ErgonomicsScorer from '../../../src/Domain/Scoring/ErgonomicsScorer.js';

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
