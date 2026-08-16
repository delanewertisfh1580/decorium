import { describe, it, expect } from 'vitest';
import { StarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';

const thresholds = { '0': 0, '1': 0, '2': 0.40, '3': 0.56, '4': 0.71, '5': 0.86 };

describe('StarRatingPolicy', () => {
  const policy = new StarRatingPolicy(thresholds);

  it('validates all canonical thresholds', () => {
    expect(policy.thresholds).toEqual(thresholds);
    expect(() => new StarRatingPolicy({ '0': 0 })).toThrow('missing threshold for 1 stars');
    expect(() => new StarRatingPolicy({ ...thresholds, '3': 'bad' })).toThrow('threshold for 3 stars must be a number');
  });

  it('returns zero stars only for an empty/zero score', () => {
    expect(policy.calculateStars(0)).toBe(0);
    expect(policy.calculateStars(-1)).toBe(0);
  });

  it('uses decomposition thresholds for positive scores', () => {
    expect(policy.calculateStars(0.10)).toBe(1);
    expect(policy.calculateStars(0.40)).toBe(2);
    expect(policy.calculateStars(0.56)).toBe(3);
    expect(policy.calculateStars(0.71)).toBe(4);
    expect(policy.calculateStars(0.86)).toBe(5);
    expect(policy.calculateStars(1.1)).toBe(5);
  });

  it('uses an authored numerical epsilon only for floating-point threshold noise', () => {
    const calibratedPolicy = new StarRatingPolicy(thresholds, { epsilon: 0.000001 });

    expect(calibratedPolicy.calculateStars(0.5599995)).toBe(3);
    expect(calibratedPolicy.calculateStars(0.559)).toBe(2);
  });

  it('returns the next canonical threshold', () => {
    expect(policy.evaluate(0)).toEqual({ stars: 0, score: 0, nextThreshold: 0.4 });
    expect(policy.evaluate(0.6)).toEqual({ stars: 3, score: 0.6, nextThreshold: 0.71 });
    expect(policy.evaluate(0.9)).toEqual({ stars: 5, score: 0.9, nextThreshold: null });
  });
});
