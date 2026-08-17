function requireMethod(value, name, method = 'evaluate') {
  if (!value || typeof value[method] !== 'function') {
    throw new Error(`MultiChannelViolationImpactPolicy ${name} must provide ${method}()`);
  }
  return value;
}

function requireArray(value, name) {
  if (!Array.isArray(value)) throw new Error(`MultiChannelViolationImpactPolicy ${name} must be an array`);
  return value;
}

function fixed(value) {
  return Number(value.toFixed(12));
}

function completionEffect(current, counterfactual) {
  if (current.completionEligible === counterfactual.completionEligible) return 'none';
  return counterfactual.completionEligible ? 'restores-completion' : 'blocks-completion';
}

function targetFit(targetResults, styleScorer) {
  return fixed(targetResults.reduce((total, target) => (
    total + target.weight * styleScorer.evaluate(target.violations ?? []).score
  ), 0));
}

function priorityScore(priorityResults) {
  const totalWeight = priorityResults.reduce((total, priority) => total + priority.weight, 0);
  if (totalWeight <= 0) throw new Error('MultiChannelViolationImpactPolicy priority weights must be positive');
  return fixed(priorityResults.reduce((total, priority) => total + priority.weight * priority.satisfaction, 0) / totalWeight);
}

function collectViolations(targetResults, compositionViolations, priorityResults, ergonomicsViolations) {
  return [
    ...targetResults.flatMap(target => target.violations ?? []),
    ...compositionViolations,
    ...priorityResults.flatMap(priority => priority.violation ? [priority.violation] : []),
    ...ergonomicsViolations
  ];
}

export class MultiChannelViolationImpactPolicy {
  constructor({ styleScorer, ergonomicsScorer, styleChannelPolicy, threeChannelScoreAggregator, scorecardCalibrationPolicy } = {}) {
    this._styleScorer = requireMethod(styleScorer, 'styleScorer');
    this._ergonomicsScorer = requireMethod(ergonomicsScorer, 'ergonomicsScorer');
    this._styleChannelPolicy = requireMethod(styleChannelPolicy, 'styleChannelPolicy');
    this._threeChannelScoreAggregator = requireMethod(threeChannelScoreAggregator, 'threeChannelScoreAggregator', 'aggregate');
    this._scorecardCalibrationPolicy = requireMethod(scorecardCalibrationPolicy, 'scorecardCalibrationPolicy');
    Object.freeze(this);
  }

  evaluate({ targetResults, compositionViolations, priorityResults, ergonomicsViolations, ratingPolicy, completion } = {}) {
    const state = {
      targetResults: requireArray(targetResults, 'targetResults'),
      compositionViolations: requireArray(compositionViolations, 'compositionViolations'),
      priorityResults: requireArray(priorityResults, 'priorityResults'),
      ergonomicsViolations: requireArray(ergonomicsViolations, 'ergonomicsViolations')
    };
    requireMethod(ratingPolicy, 'ratingPolicy');
    const current = this._scorecard({ ...state, ratingPolicy, completion });
    const candidates = [
      ...state.targetResults.flatMap((target, targetIndex) => (target.violations ?? []).map((violation, violationIndex) => ({ channel: 'style', violation, targetIndex, violationIndex }))),
      ...state.compositionViolations.map((violation, violationIndex) => ({ channel: 'style', violation, compositionIndex: violationIndex })),
      ...state.priorityResults.flatMap((priority, priorityIndex) => priority.violation ? [{ channel: 'client-priority', violation: priority.violation, priorityIndex }] : []),
      ...state.ergonomicsViolations.map((violation, ergonomicsIndex) => ({ channel: 'ergonomics', violation, ergonomicsIndex }))
    ];
    const impacts = candidates.map(candidate => {
      const counterfactual = this._scorecard({
        ...this._withoutViolation(state, candidate),
        ratingPolicy,
        completion
      });
      const channelKey = candidate.channel === 'client-priority' ? 'clientPriorityScore' : `${candidate.channel}Score`;
      return Object.freeze({
        violationId: candidate.violation.constraintId,
        channel: candidate.channel,
        channelScoreDelta: fixed(counterfactual[channelKey] - current[channelKey]),
        totalScoreDelta: fixed(counterfactual.totalScore - current.totalScore),
        displayStarsDelta: counterfactual.stars - current.stars,
        completionEffect: completionEffect(current, counterfactual)
      });
    });
    return Object.freeze({ current: Object.freeze({ ...current }), impacts: Object.freeze(impacts) });
  }

  _withoutViolation(state, candidate) {
    const targetResults = state.targetResults.map((target, targetIndex) => (
      targetIndex !== candidate.targetIndex ? target : {
        ...target,
        violations: (target.violations ?? []).filter((_, violationIndex) => violationIndex !== candidate.violationIndex)
      }
    ));
    const compositionViolations = candidate.compositionIndex === undefined
      ? state.compositionViolations
      : state.compositionViolations.filter((_, index) => index !== candidate.compositionIndex);
    const priorityResults = state.priorityResults.map((priority, index) => (
      index !== candidate.priorityIndex ? priority : { ...priority, satisfaction: 1, violation: null }
    ));
    const ergonomicsViolations = candidate.ergonomicsIndex === undefined
      ? state.ergonomicsViolations
      : state.ergonomicsViolations.filter((_, index) => index !== candidate.ergonomicsIndex);
    return { targetResults, compositionViolations, priorityResults, ergonomicsViolations };
  }

  _scorecard({ targetResults, compositionViolations, priorityResults, ergonomicsViolations, ratingPolicy, completion }) {
    const compositionScore = this._styleScorer.evaluate(compositionViolations).score;
    const styleScore = this._styleChannelPolicy.evaluate({
      weightedTargetFit: targetFit(targetResults, this._styleScorer),
      compositionScore
    }).score;
    const clientPriorityScore = priorityScore(priorityResults);
    const ergonomicsScore = this._ergonomicsScorer.evaluate(ergonomicsViolations).score;
    const aggregate = this._threeChannelScoreAggregator.aggregate({ styleScore, clientPriorityScore, ergonomicsScore });
    const scorecard = this._scorecardCalibrationPolicy.evaluate({
      totalScore: aggregate.totalScore,
      ratingPolicy,
      completion,
      violations: collectViolations(targetResults, compositionViolations, priorityResults, ergonomicsViolations)
    });
    return Object.freeze({
      styleScore,
      clientPriorityScore,
      ergonomicsScore,
      totalScore: aggregate.totalScore,
      stars: scorecard.stars,
      completionEligible: scorecard.completionEligible
    });
  }
}

export default MultiChannelViolationImpactPolicy;
