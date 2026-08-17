import { afterEach, describe, expect, it } from 'vitest';
import authoredParameters from '../../../data/scoring/scoring-parameters.json';
import {
  getScoringParameters,
  initializeScoringParameters,
  resetScoringParameters
} from '../../../src/Domain/Scoring/scoringParameters.js';

afterEach(() => resetScoringParameters());

describe('scoringParameters', () => {
  it('retains V2 authored three-channel calibration and spatial profile values', () => {
    expect(authoredParameters).toMatchObject({
      schemaVersion: 2,
      criticalStarCap: 2,
      scoreEpsilon: 0.000001,
      channelWeights: { style: 0.5, clientPriorities: 0.2, ergonomics: 0.3 },
      styleBlend: { targetFit: 0.75, composition: 0.25 },
      occupancy: { schemaVersion: 1, cellSizeMeters: 0.1 },
      densityProfiles: expect.objectContaining({ intimate: expect.any(Object), balanced: expect.any(Object), open: expect.any(Object) })
    });

    initializeScoringParameters(authoredParameters);

    expect(getScoringParameters()).toMatchObject({
      schemaVersion: 2,
      channelWeights: { style: 0.5, clientPriorities: 0.2, ergonomics: 0.3 },
      styleBlend: { targetFit: 0.75, composition: 0.25 },
      occupancy: { schemaVersion: 1, cellSizeMeters: 0.1 }
    });
  });

  it('rejects unsupported scorecard calibration versions and out-of-range values', () => {
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

    expect(() => initializeScoringParameters({ ...baseline, schemaVersion: 3 })).toThrow('schemaVersion must be 1 or 2');
    expect(() => initializeScoringParameters({ ...baseline, criticalStarCap: 5 })).toThrow('criticalStarCap must be an integer between 0 and 4');
    expect(() => initializeScoringParameters({ ...baseline, scoreEpsilon: 0.1 })).toThrow('scoreEpsilon must be between 0 and 0.01');
  });
});
