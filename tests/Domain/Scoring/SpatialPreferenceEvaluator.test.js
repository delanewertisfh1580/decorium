import { describe, expect, it } from 'vitest';
import SpatialPreferenceEvaluator from '../../../src/Domain/Scoring/SpatialPreferenceEvaluator.js';

const evaluator = new SpatialPreferenceEvaluator({
  densityProfiles: {
    intimate: { targetFreeAreaRatio: 0.42, tolerance: 0.08 },
    balanced: { targetFreeAreaRatio: 0.5, tolerance: 0.1 },
    open: { targetFreeAreaRatio: 0.62, tolerance: 0.08 }
  }
});

describe('SpatialPreferenceEvaluator', () => {
  it('penalizes excess empty area for an intimate brief with discourage-excess mode', () => {
    const result = evaluator.evaluate({
      occupancyProfile: { freeAreaRatio: 0.7 },
      spatialPreferences: {
        density: 'intimate',
        emptySpacePreference: { mode: 'discourage-excess', targetFreeAreaRatio: 0.42 }
      }
    });

    expect(result).toEqual({
      satisfaction: 0.51724137931,
      actualFreeAreaRatio: 0.7,
      minimumFreeAreaRatio: 0.34,
      maximumFreeAreaRatio: 0.42
    });
  });

  it('penalizes insufficient empty area for an open brief with require-open mode', () => {
    const result = evaluator.evaluate({
      occupancyProfile: { freeAreaRatio: 0.4 },
      spatialPreferences: {
        density: 'open',
        emptySpacePreference: { mode: 'require-open', targetFreeAreaRatio: 0.58 }
      }
    });

    expect(result).toEqual({
      satisfaction: 0.689655172414,
      actualFreeAreaRatio: 0.4,
      minimumFreeAreaRatio: 0.58,
      maximumFreeAreaRatio: 0.7
    });
  });

  it('uses density bounds as the active baseline when the client allows any empty-space preference', () => {
    const result = evaluator.evaluate({
      occupancyProfile: { freeAreaRatio: 0.75 },
      spatialPreferences: {
        density: 'balanced',
        emptySpacePreference: { mode: 'allow', targetFreeAreaRatio: 0.45 }
      }
    });

    expect(result).toEqual({
      satisfaction: 0.625,
      actualFreeAreaRatio: 0.75,
      minimumFreeAreaRatio: 0.4,
      maximumFreeAreaRatio: 0.6
    });
  });

  it('changes satisfaction when density changes even if the explicit empty-space preference is unchanged', () => {
    const preference = { mode: 'allow', targetFreeAreaRatio: 0.45 };
    const intimate = evaluator.evaluate({
      occupancyProfile: { freeAreaRatio: 0.55 },
      spatialPreferences: { density: 'intimate', emptySpacePreference: preference }
    });
    const balanced = evaluator.evaluate({
      occupancyProfile: { freeAreaRatio: 0.55 },
      spatialPreferences: { density: 'balanced', emptySpacePreference: preference }
    });

    expect(intimate.satisfaction).toBe(0.9);
    expect(balanced.satisfaction).toBe(1);
  });
});
