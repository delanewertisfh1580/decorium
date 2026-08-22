import { describe, expect, it } from 'vitest';
import authoredParameters from '../../../data/scoring/scoring-parameters.json';
import ScoringPolicy from '../../../src/Domain/Scoring/ScoringPolicy.js';

const baseline = {
  schemaVersion: 2,
  starRatingThresholds: { '0': 0, '1': 0, '2': 0.4, '3': 0.56, '4': 0.71, '5': 0.86 },
  maxPenalty: 1,
  criticalStarCap: 2,
  scoreEpsilon: 0.000001,
  channelWeights: { style: 0.5, clientPriorities: 0.2, ergonomics: 0.3 },
  styleBlend: { targetFit: 0.75, composition: 0.25 },
  occupancy: { schemaVersion: 1, cellSizeMeters: 0.1 },
  densityProfiles: {
    intimate: { targetFreeAreaRatio: 0.42, tolerance: 0.08 },
    balanced: { targetFreeAreaRatio: 0.5, tolerance: 0.1 },
    open: { targetFreeAreaRatio: 0.62, tolerance: 0.08 }
  }
};

describe('ScoringPolicy', () => {
  it('retains V2 authored calibration and spatial profiles in one immutable explicit dependency', () => {
    expect(authoredParameters).toMatchObject({
      schemaVersion: 2,
      criticalStarCap: 2,
      scoreEpsilon: 0.000001,
      channelWeights: { style: 0.5, clientPriorities: 0.2, ergonomics: 0.3 },
      styleBlend: { targetFit: 0.75, composition: 0.25 },
      occupancy: { schemaVersion: 1, cellSizeMeters: 0.1 },
      densityProfiles: expect.objectContaining({ intimate: expect.any(Object), balanced: expect.any(Object), open: expect.any(Object) })
    });

    const policy = new ScoringPolicy(authoredParameters);

    expect(policy).toMatchObject({ schemaVersion: 2, criticalStarCap: 2, scoreEpsilon: 0.000001 });
    expect(policy.channelWeights).toEqual({ style: 0.5, clientPriorities: 0.2, ergonomics: 0.3 });
    expect(policy.styleBlend).toEqual({ targetFit: 0.75, composition: 0.25 });
    expect(policy.occupancy).toEqual({ schemaVersion: 1, cellSizeMeters: 0.1 });
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.channelWeights)).toBe(true);
    expect(Object.isFrozen(policy.densityProfiles.balanced)).toBe(true);
  });

  it('creates independent policies without mutable process-global initialization', () => {
    const baselinePolicy = new ScoringPolicy(baseline);
    const adjustedPolicy = new ScoringPolicy({
      ...baseline,
      channelWeights: { style: 0.4, clientPriorities: 0.3, ergonomics: 0.3 }
    });

    expect(baselinePolicy.channelWeights.style).toBe(0.5);
    expect(adjustedPolicy.channelWeights.style).toBe(0.4);
    expect(baselinePolicy).not.toBe(adjustedPolicy);
  });

  it('rejects unsupported scorecard calibration versions and out-of-range values', () => {
    expect(() => new ScoringPolicy({ ...baseline, schemaVersion: 3 })).toThrow('schemaVersion must be 2');
    expect(() => new ScoringPolicy({ ...baseline, criticalStarCap: 5 })).toThrow('criticalStarCap must be an integer between 0 and 4');
    expect(() => new ScoringPolicy({ ...baseline, scoreEpsilon: 0.1 })).toThrow('scoreEpsilon must be between 0 and 0.01');
  });
});
