function requireMethod(value, name, method = 'evaluate') {
  if (!value || typeof value[method] !== 'function') {
    throw new Error(`ViolationImpactPolicy ${name} must provide ${method}()`);
  }
  return value;
}

function requireViolations(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`ViolationImpactPolicy ${name} must be an array`);
  }
  return value;
}

function fixedDelta(after, before) {
  return Number((after - before).toFixed(12));
}

function completionEffect(current, counterfactual) {
  if (current.completionEligible === counterfactual.completionEligible) return 'none';
  return counterfactual.completionEligible ? 'restores-completion' : 'blocks-completion';
}

function freezeImpact(value) {
  return Object.freeze({ ...value });
}

export class ViolationImpactPolicy {
  constructor({ styleScorer, ergonomicsScorer, scoreAggregator, scorecardCalibrationPolicy } = {}) {
    this._styleScorer = requireMethod(styleScorer, 'styleScorer');
    this._ergonomicsScorer = requireMethod(ergonomicsScorer, 'ergonomicsScorer');
    this._scoreAggregator = requireMethod(scoreAggregator, 'scoreAggregator', 'aggregate');
    this._scorecardCalibrationPolicy = requireMethod(scorecardCalibrationPolicy, 'scorecardCalibrationPolicy');
    Object.freeze(this);
  }

  evaluate({ styleViolations, ergonomicsViolations, ratingPolicy, completion } = {}) {
    const currentStyleViolations = requireViolations(styleViolations, 'styleViolations');
    const currentErgonomicsViolations = requireViolations(ergonomicsViolations, 'ergonomicsViolations');
    requireMethod(ratingPolicy, 'ratingPolicy');

    const current = this._scorecard({
      styleViolations: currentStyleViolations,
      ergonomicsViolations: currentErgonomicsViolations,
      ratingPolicy,
      completion
    });
    const impacts = [
      ...currentStyleViolations.map((violation, index) => this._impactFor({
        channel: 'style',
        violation,
        index,
        styleViolations: currentStyleViolations,
        ergonomicsViolations: currentErgonomicsViolations,
        ratingPolicy,
        completion,
        current
      })),
      ...currentErgonomicsViolations.map((violation, index) => this._impactFor({
        channel: 'ergonomics',
        violation,
        index,
        styleViolations: currentStyleViolations,
        ergonomicsViolations: currentErgonomicsViolations,
        ratingPolicy,
        completion,
        current
      }))
    ];

    return Object.freeze({
      current: freezeImpact(current),
      impacts: Object.freeze(impacts)
    });
  }

  _impactFor({ channel, violation, index, styleViolations, ergonomicsViolations, ratingPolicy, completion, current }) {
    const counterfactual = this._scorecard({
      styleViolations: channel === 'style'
        ? styleViolations.filter((_, candidateIndex) => candidateIndex !== index)
        : styleViolations,
      ergonomicsViolations: channel === 'ergonomics'
        ? ergonomicsViolations.filter((_, candidateIndex) => candidateIndex !== index)
        : ergonomicsViolations,
      ratingPolicy,
      completion
    });

    return freezeImpact({
      violationId: violation?.constraintId,
      channel,
      channelScoreDelta: fixedDelta(
        channel === 'style' ? counterfactual.styleScore : counterfactual.ergonomicsScore,
        channel === 'style' ? current.styleScore : current.ergonomicsScore
      ),
      totalScoreDelta: fixedDelta(counterfactual.totalScore, current.totalScore),
      displayStarsDelta: counterfactual.stars - current.stars,
      completionEffect: completionEffect(current, counterfactual)
    });
  }

  _scorecard({ styleViolations, ergonomicsViolations, ratingPolicy, completion }) {
    const styleScoring = this._styleScorer.evaluate(styleViolations);
    const ergonomicsScoring = this._ergonomicsScorer.evaluate(ergonomicsViolations);
    const aggregate = this._scoreAggregator.aggregate({
      styleScore: styleScoring.score,
      ergonomicsScore: ergonomicsScoring.score
    });
    const scorecard = this._scorecardCalibrationPolicy.evaluate({
      totalScore: aggregate.totalScore,
      ratingPolicy,
      completion,
      violations: [...styleViolations, ...ergonomicsViolations]
    });

    return Object.freeze({
      styleScore: styleScoring.score,
      ergonomicsScore: ergonomicsScoring.score,
      totalScore: aggregate.totalScore,
      stars: scorecard.stars,
      completionEligible: scorecard.completionEligible
    });
  }
}

export default ViolationImpactPolicy;
