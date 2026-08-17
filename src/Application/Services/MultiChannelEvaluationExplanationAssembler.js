function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freeze(nested);
  return Object.freeze(value);
}

function requireMethod(value, name, method) {
  if (!value || typeof value[method] !== 'function') {
    throw new Error(`MultiChannelEvaluationExplanationAssembler ${name} must provide ${method}()`);
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

export class MultiChannelEvaluationExplanationAssembler {
  constructor({ violationImpactPolicy, feedbackCatalog } = {}) {
    this._violationImpactPolicy = requireMethod(violationImpactPolicy, 'violationImpactPolicy', 'evaluate');
    this._feedbackCatalog = requireMethod(feedbackCatalog, 'feedbackCatalog', 'getViolationExplanation');
    Object.freeze(this);
  }

  async assemble({ roomState, targetResults, compositionViolations, priorityResults, ergonomicsViolations, ratingPolicy, completion, scorecard } = {}) {
    if (!roomState || typeof roomState.getItem !== 'function') {
      throw new Error('MultiChannelEvaluationExplanationAssembler roomState must provide getItem()');
    }
    const impactResult = this._violationImpactPolicy.evaluate({
      targetResults,
      compositionViolations,
      priorityResults,
      ergonomicsViolations,
      ratingPolicy,
      completion
    });
    const impactById = new Map(impactResult.impacts.map(impact => [impact.violationId, impact]));
    const sourceViolations = [
      ...targetResults.flatMap(target => (target.violations ?? []).map(violation => ({ violation, channel: 'style', priority: null }))),
      ...compositionViolations.map(violation => ({ violation, channel: 'style', priority: null })),
      ...priorityResults.flatMap(priority => priority.violation ? [{
        violation: priority.violation,
        channel: 'client-priority',
        priority: { id: priority.id, label: priority.label, ruleKind: priority.ruleKind }
      }] : []),
      ...ergonomicsViolations.map(violation => ({ violation, channel: 'ergonomics', priority: null }))
    ];
    const violations = await Promise.all(sourceViolations.map(source => (
      this._serializeViolation(source, impactById, roomState)
    )));
    return freeze({
      schemaVersion: 2,
      scorecard: {
        rawScore: scorecard.rawScore,
        rawStars: scorecard.rawStars,
        displayStars: scorecard.stars,
        completionEligible: scorecard.completionEligible ?? null,
        completionBlockReason: scorecard.completionBlockReason ?? null
      },
      violations
    });
  }

  async _serializeViolation({ violation, channel, priority }, impactById, roomState) {
    const feedback = await this._feedbackCatalog.getViolationExplanation(violation.messageKey, {
      threshold: violation.threshold,
      value: violation.actualValue
    });
    if (!feedback) {
      throw new Error(`MultiChannelEvaluationExplanationAssembler missing authored feedback for violation ${violation.messageKey}`);
    }
    const impact = impactById.get(violation.constraintId);
    if (!impact) {
      throw new Error(`MultiChannelEvaluationExplanationAssembler missing impact for violation ${violation.constraintId}`);
    }
    const instances = resolveInstances(roomState, violation.itemIds);
    return freeze({
      id: violation.constraintId,
      channel,
      scope: instances.length > 0 ? 'instances' : 'room',
      ...(priority ? { priority } : {}),
      rule: { messageKey: violation.messageKey, description: violation.constraint.description },
      fact: { operator: violation.operator, actual: violation.actualValue, desired: violation.threshold },
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

export default MultiChannelEvaluationExplanationAssembler;
