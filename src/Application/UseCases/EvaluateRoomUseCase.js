import EvaluationResultDTO from '../DTOs/EvaluationResultDTO.js';
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';
import { evaluateComposition } from '../../Domain/Scoring/CompositionEvaluator.js';
import EvaluationExplanationAssembler from '../Services/EvaluationExplanationAssembler.js';

function serializeViolation(violation, type = null) {
  return {
    id: violation.constraintId,
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

export class EvaluateRoomUseCase {
  constructor(
    roomRepository,
    constraintEvaluator,
    styleScorer,
    starRatingPolicy,
    feedbackCatalog = null,
    ergonomicsEvaluator = null,
    ergonomicsScorer = null,
    scoreAggregator = null,
    scorecardCalibrationPolicy = null,
    violationImpactPolicy = null
  ) {
    if (!roomRepository) throw new Error('EvaluateRoomUseCase: roomRepository is required.');
    if (!constraintEvaluator) throw new Error('EvaluateRoomUseCase: constraintEvaluator is required.');
    if (!styleScorer) throw new Error('EvaluateRoomUseCase: styleScorer is required.');
    if (!starRatingPolicy) throw new Error('EvaluateRoomUseCase: starRatingPolicy is required.');
    if (scorecardCalibrationPolicy && typeof scorecardCalibrationPolicy.evaluate !== 'function') {
      throw new Error('EvaluateRoomUseCase: scorecardCalibrationPolicy must provide evaluate.');
    }
    if (violationImpactPolicy && typeof violationImpactPolicy.evaluate !== 'function') {
      throw new Error('EvaluateRoomUseCase: violationImpactPolicy must provide evaluate.');
    }
    const ergonomicsDependencies = [ergonomicsEvaluator, ergonomicsScorer, scoreAggregator];
    if (ergonomicsDependencies.some(Boolean) && !ergonomicsDependencies.every(Boolean)) {
      throw new Error('EvaluateRoomUseCase: ergonomics dependencies must be provided together.');
    }
    this.roomRepository = roomRepository;
    this.constraintEvaluator = constraintEvaluator;
    this.styleScorer = styleScorer;
    this.starRatingPolicy = starRatingPolicy;
    this.feedbackCatalog = feedbackCatalog;
    this.ergonomicsEvaluator = ergonomicsEvaluator;
    this.ergonomicsScorer = ergonomicsScorer;
    this.scoreAggregator = scoreAggregator;
    this.scorecardCalibrationPolicy = scorecardCalibrationPolicy;
    this.evaluationExplanationAssembler = violationImpactPolicy
      ? new EvaluationExplanationAssembler({ violationImpactPolicy, feedbackCatalog })
      : null;
  }

  async execute(roomId, constraints, compositionRules = {}, ergonomicsRules = {}, completion = null) {
    if (!roomId || typeof roomId !== 'string') return EvaluationResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!Array.isArray(constraints)) return EvaluationResultDTO.failure('INVALID_INPUT: Constraints must be an array.');

    try {
      const roomState = await this.roomRepository.getState(roomId);
      if (!roomState) return EvaluationResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);

      const placedItems = roomState.getItems();
      const hasErgonomicsChannel = Boolean(this.ergonomicsEvaluator);
      const hasSpatialRules = Boolean(ergonomicsRules.minimumClearance)
        || (Array.isArray(ergonomicsRules.passageZones) && ergonomicsRules.passageZones.length > 0)
        || (Array.isArray(ergonomicsRules.functionalLayoutRules) && ergonomicsRules.functionalLayoutRules.length > 0)
        || (Array.isArray(ergonomicsRules.requiredFunctionalScenarios) && ergonomicsRules.requiredFunctionalScenarios.length > 0);
      if (placedItems.length === 0) {
        const ergonomicsViolations = hasErgonomicsChannel && hasSpatialRules
          ? this.ergonomicsEvaluator.evaluate(roomState, ergonomicsRules)
          : [];
        const feedback = this.feedbackCatalog
          ? await this.feedbackCatalog.formatFeedback('composition-empty')
          : 'Комната пуста (Room is empty). Добавьте предметы, чтобы получить оценку.';
        const scorecard = this._evaluateScorecard(0, ergonomicsViolations, completion);
        const explanation = await this._assembleExplanation({
          roomState,
          styleViolations: [],
          ergonomicsViolations,
          scorecard,
          completion
        });
        return EvaluationResultDTO.success({
          score: 0,
          rawScore: scorecard.rawScore,
          rawStars: scorecard.rawStars,
          penalty: 1,
          stars: scorecard.stars,
          nextThreshold: scorecard.nextThreshold,
          ...(scorecard.hasCalibration ? {
            completionEligible: scorecard.completionEligible,
            completionBlockReason: scorecard.completionBlockReason,
            criticalViolationIds: scorecard.criticalViolationIds
          } : {}),
          ...(explanation ? { explanation } : {}),
          violations: ergonomicsViolations.map(violation => serializeViolation(violation, 'ergonomics')),
          itemCount: 0,
          roomVector: null,
          feedback
        });
      }

      const roomVector = FeatureVector.average(placedItems.map(placed => placed.featureVector));
      const evaluations = this.constraintEvaluator.evaluateAll(constraints, roomVector);
      const styleViolations = evaluations.filter(result => !result.isSatisfied).map(result => result.violation);
      const composition = evaluateComposition(placedItems, compositionRules);
      const styleChannelViolations = [...styleViolations, ...composition.violations];
      const styleScoring = this.styleScorer.evaluate(styleChannelViolations);

      const ergonomicsViolations = hasErgonomicsChannel && hasSpatialRules
        ? this.ergonomicsEvaluator.evaluate(roomState, ergonomicsRules)
        : [];
      const ergonomicsScoring = hasErgonomicsChannel
        ? this.ergonomicsScorer.evaluate(ergonomicsViolations)
        : null;
      const aggregate = hasErgonomicsChannel
        ? this.scoreAggregator.aggregate({ styleScore: styleScoring.score, ergonomicsScore: ergonomicsScoring.score })
        : null;
      const score = aggregate?.totalScore ?? styleScoring.score;
      const allViolations = [...styleChannelViolations, ...ergonomicsViolations];
      const scorecard = this._evaluateScorecard(score, allViolations, completion);
      const explanation = await this._assembleExplanation({
        roomState,
        styleViolations: styleChannelViolations,
        ergonomicsViolations,
        scorecard,
        completion
      });
      const feedback = this.feedbackCatalog
        ? await this.feedbackCatalog.getEvaluationFeedback(scorecard.stars, allViolations)
        : this._generateFeedback(scorecard.stars, allViolations);

      return EvaluationResultDTO.success({
        score,
        rawScore: scorecard.rawScore,
        rawStars: scorecard.rawStars,
        penalty: styleScoring.penalty,
        stars: scorecard.stars,
        nextThreshold: scorecard.nextThreshold,
        ...(scorecard.hasCalibration ? {
          completionEligible: scorecard.completionEligible,
          completionBlockReason: scorecard.completionBlockReason,
          criticalViolationIds: scorecard.criticalViolationIds
        } : {}),
        ...(explanation ? { explanation } : {}),
        violations: [
          ...styleChannelViolations.map(violation => serializeViolation(violation)),
          ...ergonomicsViolations.map(violation => serializeViolation(violation, 'ergonomics'))
        ],
        itemCount: placedItems.length,
        roomVector: roomVector.toArray(),
        feedback,
        ...(hasErgonomicsChannel ? {
          styleScore: styleScoring.score,
          ergonomicsScore: ergonomicsScoring.score,
          stylePenalty: styleScoring.penalty,
          ergonomicsPenalty: ergonomicsScoring.penalty,
          scoreWeights: { style: aggregate.styleWeight, ergonomics: aggregate.ergonomicsWeight }
        } : {})
      });
    } catch (error) {
      console.error(`EvaluateRoomUseCase: Error evaluating room ${roomId}:`, error);
      return EvaluationResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }

  async _assembleExplanation({ roomState, styleViolations, ergonomicsViolations, scorecard, completion }) {
    if (!this.evaluationExplanationAssembler || !completion || !scorecard.hasCalibration) return null;
    return this.evaluationExplanationAssembler.assemble({
      roomState,
      styleViolations,
      ergonomicsViolations,
      ratingPolicy: this.starRatingPolicy,
      completion,
      scorecard
    });
  }

  _evaluateScorecard(score, violations, completion) {
    if (this.scorecardCalibrationPolicy && completion) {
      return { ...this.scorecardCalibrationPolicy.evaluate({
        totalScore: score,
        ratingPolicy: this.starRatingPolicy,
        completion,
        violations
      }), hasCalibration: true };
    }

    const rawRating = this.starRatingPolicy.evaluate(score);
    return {
      rawScore: score,
      rawStars: rawRating.stars,
      stars: rawRating.stars,
      nextThreshold: rawRating.nextThreshold,
      hasCalibration: false
    };
  }

  _generateFeedback(stars) {
    if (stars >= 5) return 'Excellent! Your room design perfectly matches the style.';
    if (stars >= 4) return 'Great job! The room looks good with minor improvements needed.';
    if (stars >= 3) return 'Not bad. Some adjustments could improve the overall style.';
    if (stars >= 2) return 'The room needs significant changes to match the style.';
    if (stars >= 1) return 'Poor result. Try reviewing the style guidelines and rearranging items.';
    return 'Very poor. Start by placing items that match the style constraints.';
  }
}

export default EvaluateRoomUseCase;
