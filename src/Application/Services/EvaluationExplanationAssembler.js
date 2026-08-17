function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freeze(nested);
  return Object.freeze(value);
}

function requireImpactPolicy(value) {
  if (!value || typeof value.evaluate !== 'function') {
    throw new Error('EvaluationExplanationAssembler violationImpactPolicy must provide evaluate()');
  }
  return value;
}

function requireFeedbackCatalog(value) {
  if (!value || typeof value.getViolationExplanation !== 'function') {
    throw new Error('EvaluationExplanationAssembler feedbackCatalog must provide getViolationExplanation()');
  }
  return value;
}

function resolveInstances(roomState, itemIds) {
  if (!Array.isArray(itemIds)) return Object.freeze([]);
  const seen = new Set();
  return Object.freeze(itemIds.flatMap(instanceId => {
    if (seen.has(instanceId)) return [];
    seen.add(instanceId);
    const placed = roomState.getItem(instanceId);
    if (!placed) return [];
    return [freeze({
      instanceId: placed.id,
      itemId: placed.itemId,
      displayName: placed.item.name
    })];
  }));
}

export class EvaluationExplanationAssembler {
  constructor({ violationImpactPolicy, feedbackCatalog } = {}) {
    this._violationImpactPolicy = requireImpactPolicy(violationImpactPolicy);
    this._feedbackCatalog = requireFeedbackCatalog(feedbackCatalog);
    Object.freeze(this);
  }

  async assemble({ roomState, styleViolations, ergonomicsViolations, ratingPolicy, completion, scorecard }) {
    if (!roomState || typeof roomState.getItem !== 'function') {
      throw new Error('EvaluationExplanationAssembler roomState must provide getItem()');
    }
    const impactResult = this._violationImpactPolicy.evaluate({
      styleViolations,
      ergonomicsViolations,
      ratingPolicy,
      completion
    });
    const impactById = new Map(impactResult.impacts.map(impact => [impact.violationId, impact]));
    const serializedViolations = await Promise.all([
      ...styleViolations.map(violation => this._serializeViolation(violation, 'style', impactById, roomState)),
      ...ergonomicsViolations.map(violation => this._serializeViolation(violation, 'ergonomics', impactById, roomState))
    ]);

    return freeze({
      schemaVersion: 1,
      scorecard: {
        rawScore: scorecard.rawScore,
        rawStars: scorecard.rawStars,
        displayStars: scorecard.stars,
        completionEligible: scorecard.completionEligible ?? null,
        completionBlockReason: scorecard.completionBlockReason ?? null
      },
      violations: serializedViolations
    });
  }

  async _serializeViolation(violation, channel, impactById, roomState) {
    const instances = resolveInstances(roomState, violation.itemIds);
    const impact = impactById.get(violation.constraintId);
    const feedback = await this._feedbackCatalog.getViolationExplanation(violation.messageKey, {
      threshold: violation.threshold,
      value: violation.actualValue
    });
    if (!feedback) {
      throw new Error(`EvaluationExplanationAssembler missing authored feedback for violation ${violation.messageKey}`);
    }
    if (!impact) {
      throw new Error(`EvaluationExplanationAssembler missing impact for violation ${violation.constraintId}`);
    }

    return freeze({
      id: violation.constraintId,
      channel,
      scope: instances.length > 0 ? 'instances' : 'room',
      rule: {
        messageKey: violation.messageKey,
        description: violation.constraint.description
      },
      fact: {
        operator: violation.operator,
        actual: violation.actualValue,
        desired: violation.threshold
      },
      severity: {
        level: violation.critical === true ? 'critical' : feedback.severity,
        value: violation.severity,
        critical: violation.critical === true
      },
      impact: {
        channelScoreDelta: impact.channelScoreDelta,
        totalScoreDelta: impact.totalScoreDelta,
        displayStarsDelta: impact.displayStarsDelta,
        completionEffect: impact.completionEffect
      },
      remediation: feedback.remediation,
      instances
    });
  }
}

export default EvaluationExplanationAssembler;
