let _scoringParameters = null;

export function initializeScoringParameters(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('scoringParameters: params must be a valid object');
  }

  if (params.schemaVersion !== 1) {
    throw new Error('scoringParameters: schemaVersion must be 1');
  }
  if (!Number.isInteger(params.criticalStarCap) || params.criticalStarCap < 0 || params.criticalStarCap > 4) {
    throw new Error('scoringParameters: criticalStarCap must be an integer between 0 and 4');
  }
  if (typeof params.scoreEpsilon !== 'number' || !Number.isFinite(params.scoreEpsilon)
    || params.scoreEpsilon < 0 || params.scoreEpsilon > 0.01) {
    throw new Error('scoringParameters: scoreEpsilon must be between 0 and 0.01');
  }

  const thresholds = params.starRatingThresholds ?? params.starThresholds;
  if (!thresholds || typeof thresholds !== 'object' || Array.isArray(thresholds)) {
    throw new Error('scoringParameters: missing starRatingThresholds');
  }

  for (const key of ['0', '1', '2', '3', '4', '5']) {
    if (typeof thresholds[key] !== 'number') {
      throw new Error(`scoringParameters: missing threshold for ${key} stars`);
    }
  }

  if (typeof params.maxPenalty !== 'number' || params.maxPenalty <= 0) {
    throw new Error('scoringParameters: maxPenalty must be a positive number');
  }

  _scoringParameters = Object.freeze({
    schemaVersion: params.schemaVersion,
    starRatingThresholds: Object.freeze({ ...thresholds }),
    maxPenalty: params.maxPenalty,
    styleWeight: typeof params.styleWeight === 'number' ? params.styleWeight : 1,
    ergonomicsWeight: typeof params.ergonomicsWeight === 'number' ? params.ergonomicsWeight : 0,
    defaultWeight: typeof params.defaultWeight === 'number' ? params.defaultWeight : 1,
    criticalStarCap: params.criticalStarCap,
    scoreEpsilon: params.scoreEpsilon
  });
}

export function getScoringParameters() {
  if (!_scoringParameters) {
    throw new Error('scoringParameters: not initialized. Call initializeScoringParameters first.');
  }
  return _scoringParameters;
}

export function resetScoringParameters() {
  _scoringParameters = null;
}
