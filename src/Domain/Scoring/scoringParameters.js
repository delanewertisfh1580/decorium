let _scoringParameters = null;

export function initializeScoringParameters(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('scoringParameters: params must be a valid object');
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
    starRatingThresholds: Object.freeze({ ...thresholds }),
    maxPenalty: params.maxPenalty,
    styleWeight: typeof params.styleWeight === 'number' ? params.styleWeight : 1,
    ergonomicsWeight: typeof params.ergonomicsWeight === 'number' ? params.ergonomicsWeight : 0,
    defaultWeight: typeof params.defaultWeight === 'number' ? params.defaultWeight : 1
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
