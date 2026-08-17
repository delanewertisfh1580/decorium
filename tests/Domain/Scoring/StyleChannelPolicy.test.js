import { describe, expect, it } from 'vitest';
import StyleChannelPolicy from '../../../src/Domain/Scoring/StyleChannelPolicy.js';

describe('StyleChannelPolicy', () => {
  it('combines multi-style target fit and a single composition score through normalized authored blend weights', () => {
    const policy = new StyleChannelPolicy({ targetFitWeight: 0.75, compositionWeight: 0.25 });

    expect(policy.evaluate({ weightedTargetFit: 0.8, compositionScore: 0.4 })).toEqual({
      score: 0.7,
      targetFitWeight: 0.75,
      compositionWeight: 0.25
    });
  });

  it('rejects absent composition instead of scoring it once per style target or hiding it', () => {
    const policy = new StyleChannelPolicy({ targetFitWeight: 0.75, compositionWeight: 0.25 });

    expect(() => policy.evaluate({ weightedTargetFit: 0.8 })).toThrow('StyleChannelPolicy compositionScore must be between 0 and 1');
  });
});
