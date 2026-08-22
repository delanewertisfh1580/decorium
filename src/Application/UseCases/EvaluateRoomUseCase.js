import EvaluationResultDTO from '../DTOs/EvaluationResultDTO.js';
import { evaluateComposition } from '../../Domain/Scoring/CompositionEvaluator.js';
import MultiChannelEvaluationExplanationAssembler from '../Services/MultiChannelEvaluationExplanationAssembler.js';

function serializeViolation(violation, type = null) {
  return {
    id: violation.diagnosticId,
    constraintId: violation.constraintId,
    feature: violation.featureName,
    operator: violation.operator,
    threshold: violation.threshold,
    actualValue: violation.actualValue,
    severity: violation.severity,
    messageKey: violation.messageKey,
    message: violation.constraint.description,
    ...(type ? { type } : {}),
    ...(typeof violation.critical === 'boolean' ? { critical: violation.critical } : {}),
    ...(Array.isArray(violation.itemIds) ? { itemIds: [...violation.itemIds] } : {})
  };
}

function requireMethod(value, label, method) {
  if (!value || typeof value[method] !== 'function') {
    throw new Error(`EvaluateRoomUseCase: ${label} must provide ${method}.`);
  }
  return value;
}

function requireStyleInfluenceProfile(value) {
  requireMethod(value, 'multiStyleDependencies.styleInfluenceProfile', 'evaluate');
  if (!value.policy || typeof value.policy !== 'object') {
    throw new Error('EvaluateRoomUseCase: multiStyleDependencies.styleInfluenceProfile must provide policy.');
  }
  return value;
}

export class EvaluateRoomUseCase {
  constructor(
    roomRepository,
    styleScorer,
    starRatingPolicy,
    feedbackCatalog,
    ergonomicsEvaluator,
    ergonomicsScorer,
    scorecardCalibrationPolicy,
    multiStyleDependencies
  ) {
    requireMethod(roomRepository, 'roomRepository', 'getState');
    requireMethod(styleScorer, 'styleScorer', 'evaluate');
    requireMethod(starRatingPolicy, 'starRatingPolicy', 'evaluate');
    requireMethod(feedbackCatalog, 'feedbackCatalog', 'getEvaluationFeedback');
    requireMethod(ergonomicsEvaluator, 'ergonomicsEvaluator', 'evaluate');
    requireMethod(ergonomicsScorer, 'ergonomicsScorer', 'evaluate');
    requireMethod(scorecardCalibrationPolicy, 'scorecardCalibrationPolicy', 'evaluate');

    const requiredV2Dependencies = [
      ['multiStyleEvaluator', 'evaluate'],
      ['styleChannelPolicy', 'evaluate'],
      ['roomOccupancyProfile', 'evaluate'],
      ['clientPriorityEvaluator', 'evaluate'],
      ['threeChannelScoreAggregator', 'aggregate'],
      ['multiChannelViolationImpactPolicy', 'evaluate']
    ];
    for (const [dependency, method] of requiredV2Dependencies) {
      requireMethod(multiStyleDependencies?.[dependency], `multiStyleDependencies.${dependency}`, method);
    }
    requireStyleInfluenceProfile(multiStyleDependencies?.styleInfluenceProfile);

    this.roomRepository = roomRepository;
    this.styleScorer = styleScorer;
    this.starRatingPolicy = starRatingPolicy;
    this.feedbackCatalog = feedbackCatalog;
    this.ergonomicsEvaluator = ergonomicsEvaluator;
    this.ergonomicsScorer = ergonomicsScorer;
    this.scorecardCalibrationPolicy = scorecardCalibrationPolicy;
    this.multiStyleDependencies = multiStyleDependencies;
    this.multiChannelEvaluationExplanationAssembler = new MultiChannelEvaluationExplanationAssembler({
      violationImpactPolicy: multiStyleDependencies.multiChannelViolationImpactPolicy,
      feedbackCatalog
    });
  }

  async execute({ roomId, evaluationSpec } = {}) {
    if (!roomId || typeof roomId !== 'string') {
      return EvaluationResultDTO.failure('INVALID_INPUT: RoomID is required.');
    }
    if (!evaluationSpec || evaluationSpec.schemaVersion !== 1) {
      return EvaluationResultDTO.failure('INVALID_INPUT: EvaluationSpec v1 is required.');
    }

    try {
      const roomState = await this.roomRepository.getState(roomId);
      if (!roomState) return EvaluationResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      return await this._evaluateV2({ roomState, placedItems: roomState.getItems(), evaluationSpec });
    } catch (error) {
      console.error(`EvaluateRoomUseCase: Error evaluating room ${roomId}:`, error);
      return EvaluationResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }

  async _evaluateV2({ roomState, placedItems, evaluationSpec }) {
    const {
      multiStyleEvaluator,
      styleChannelPolicy,
      roomOccupancyProfile,
      clientPriorityEvaluator,
      threeChannelScoreAggregator,
      styleInfluenceProfile
    } = this.multiStyleDependencies;
    const styleInfluence = placedItems.length > 0
      ? styleInfluenceProfile.evaluate({ placedItems })
      : null;
    const appliedStyleInfluence = Object.freeze({
      policy: styleInfluenceProfile.policy,
      totalWeight: styleInfluence?.totalWeight ?? 0,
      contributions: styleInfluence?.contributions ?? Object.freeze([])
    });
    const roomVector = styleInfluence?.roomVector ?? null;
    const multiStyle = roomVector
      ? multiStyleEvaluator.evaluate({ roomVector, targets: evaluationSpec.styleTargets })
      : {
        weightedTargetFit: 0,
        targets: evaluationSpec.styleTargets.map(target => ({
          styleId: target.styleId,
          role: target.role,
          weight: target.weight,
          score: 0,
          penalty: 1,
          violations: []
        }))
      };
    const styleTargetViolations = multiStyle.targets.flatMap(target => target.violations);
    const composition = evaluateComposition(placedItems, evaluationSpec.compositionRules);
    const compositionScoring = this.styleScorer.evaluate(composition.violations);
    const styleChannel = styleChannelPolicy.evaluate({
      weightedTargetFit: multiStyle.weightedTargetFit,
      compositionScore: compositionScoring.score
    });
    const styleTargetPenalty = Number((1 - multiStyle.weightedTargetFit).toFixed(12));
    const compositionPenalty = compositionScoring.penalty;
    const styleChannelPenalty = Number((1 - styleChannel.score).toFixed(12));
    const occupancyProfile = roomOccupancyProfile.evaluate({ roomState });
    const priority = clientPriorityEvaluator.evaluate({
      priorities: evaluationSpec.clientPriorities,
      scenarios: evaluationSpec.ergonomicsRules.requiredFunctionalScenarios ?? [],
      roomState,
      occupancyProfile,
      spatialPreferences: evaluationSpec.spatialPreferences,
      functionalSatisfactionPolicy: evaluationSpec.functionalSatisfactionPolicy
    });
    const ergonomicsViolations = this.ergonomicsEvaluator.evaluate(roomState, evaluationSpec.ergonomicsRules);
    const ergonomicsScoring = this.ergonomicsScorer.evaluate(ergonomicsViolations);
    const aggregate = threeChannelScoreAggregator.aggregate({
      styleScore: styleChannel.score,
      clientPriorityScore: priority.score,
      ergonomicsScore: ergonomicsScoring.score
    });
    const allViolations = [
      ...styleTargetViolations,
      ...composition.violations,
      ...priority.violations,
      ...ergonomicsViolations
    ];
    const scorecard = this._evaluateScorecard(aggregate.totalScore, allViolations, evaluationSpec.completion);
    const explanation = await this.multiChannelEvaluationExplanationAssembler.assemble({
      roomState,
      targetResults: multiStyle.targets,
      compositionViolations: composition.violations,
      priorityResults: priority.results,
      ergonomicsViolations,
      ratingPolicy: this.starRatingPolicy,
      completion: evaluationSpec.completion,
      scorecard
    });
    const feedback = await this.feedbackCatalog.getEvaluationFeedback(scorecard.stars, allViolations);

    return EvaluationResultDTO.success({
      score: aggregate.totalScore,
      rawScore: scorecard.rawScore,
      rawStars: scorecard.rawStars,
      styleTargetPenalty,
      compositionPenalty,
      styleChannelPenalty,
      stars: scorecard.stars,
      nextThreshold: scorecard.nextThreshold,
      completionEligible: scorecard.completionEligible,
      completionBlockReason: scorecard.completionBlockReason,
      criticalViolationIds: scorecard.criticalViolationIds,
      explanation,
      violations: [
        ...styleTargetViolations.map(violation => serializeViolation(violation, 'style')),
        ...composition.violations.map(violation => serializeViolation(violation, 'style')),
        ...priority.violations.map(violation => serializeViolation(violation, 'client-priority')),
        ...ergonomicsViolations.map(violation => serializeViolation(violation, 'ergonomics'))
      ],
      itemCount: placedItems.length,
      roomVector: roomVector?.toArray() ?? null,
      styleInfluence: appliedStyleInfluence,
      feedback,
      styleScore: styleChannel.score,
      clientPriorityScore: priority.score,
      ergonomicsScore: ergonomicsScoring.score,
      ergonomicsPenalty: ergonomicsScoring.penalty,
      scoreWeights: {
        style: aggregate.styleWeight,
        clientPriorities: aggregate.clientPriorityWeight,
        ergonomics: aggregate.ergonomicsWeight
      },
      scoreBreakdown: {
        schemaVersion: 1,
        style: {
          score: styleChannel.score,
          weight: aggregate.styleWeight,
          weightedTargetFit: multiStyle.weightedTargetFit,
          targetPenalty: styleTargetPenalty,
          compositionScore: compositionScoring.score,
          compositionPenalty,
          channelPenalty: styleChannelPenalty,
          influence: appliedStyleInfluence,
          targets: multiStyle.targets
        },
        clientPriorities: {
          score: priority.score,
          weight: aggregate.clientPriorityWeight,
          results: priority.results,
          occupancyProfile
        },
        ergonomics: {
          score: ergonomicsScoring.score,
          weight: aggregate.ergonomicsWeight
        }
      }
    });
  }

  _evaluateScorecard(score, violations, completion) {
    return this.scorecardCalibrationPolicy.evaluate({
      totalScore: score,
      ratingPolicy: this.starRatingPolicy,
      completion,
      violations
    });
  }
}

export default EvaluateRoomUseCase;
