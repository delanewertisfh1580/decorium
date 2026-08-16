import { afterEach, describe, expect, it } from 'vitest';
import authoredParameters from '../../../data/scoring/scoring-parameters.json';
import {
  getScoringParameters,
  initializeScoringParameters,
  resetScoringParameters
} from '../../../src/Domain/Scoring/scoringParameters.js';

afterEach(() => resetScoringParameters());

describe('scoringParameters', () => {
  it('retains versioned authored scorecard calibration values', () => {
    expect(authoredParameters).toMatchObject({
      schemaVersion: 1,
      criticalStarCap: 2,
      scoreEpsilon: 0.000001
    });

    initializeScoringParameters(authoredParameters);

    expect(getScoringParameters()).toMatchObject({
      schemaVersion: 1,
      criticalStarCap: 2,
      scoreEpsilon: 0.000001
    });
  });

  it('rejects unsupported scorecard calibration versions and out-of-range values', () => {
    const baseline = {
      schemaVersion: 1,
      starRatingThresholds: { '0': 0, '1': 0, '2': 0.4, '3': 0.56, '4': 0.71, '5': 0.86 },
      maxPenalty: 1,
      criticalStarCap: 2,
      scoreEpsilon: 0.000001
    };

    expect(() => initializeScoringParameters({ ...baseline, schemaVersion: 2 })).toThrow('schemaVersion must be 1');
    expect(() => initializeScoringParameters({ ...baseline, criticalStarCap: 5 })).toThrow('criticalStarCap must be an integer between 0 and 4');
    expect(() => initializeScoringParameters({ ...baseline, scoreEpsilon: 0.1 })).toThrow('scoreEpsilon must be between 0 and 0.01');
  });
});
