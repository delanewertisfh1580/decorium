import EvaluationResultDTO from '../DTOs/EvaluationResultDTO.js';
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';
import { evaluateComposition } from '../../Domain/Scoring/CompositionEvaluator.js';

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
    scoreAggregator = null
  ) {
    if (!roomRepository) throw new Error('EvaluateRoomUseCase: roomRepository is required.');
    if (!constraintEvaluator) throw new Error('EvaluateRoomUseCase: constraintEvaluator is required.');
    if (!styleScorer) throw new Error('EvaluateRoomUseCase: styleScorer is required.');
    if (!starRatingPolicy) throw new Error('EvaluateRoomUseCase: starRatingPolicy is required.');
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
  }

  async execute(roomId, constraints, compositionRules = {}, ergonomicsRules = {}) {
    if (!roomId || typeof roomId !== 'string') return EvaluationResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!Array.isArray(constraints)) return EvaluationResultDTO.failure('INVALID_INPUT: Constraints must be an array.');

    try {
      const roomState = await this.roomRepository.getState(roomId);
      if (!roomState) return EvaluationResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);

      const placedItems = roomState.getItems();
      if (placedItems.length === 0) {
        const feedback = this.feedbackCatalog
          ? await this.feedbackCatalog.formatFeedback('composition-empty')
          : 'Комната пуста (Room is empty). Добавьте предметы, чтобы получить оценку.';
        return EvaluationResultDTO.success({
          score: 0,
          penalty: 1,
          stars: 0,
          nextThreshold: 0.4,
          violations: [],
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

      const hasErgonomicsChannel = Boolean(this.ergonomicsEvaluator);
      const hasSpatialRules = Boolean(ergonomicsRules.minimumClearance)
        || (Array.isArray(ergonomicsRules.passageZones) && ergonomicsRules.passageZones.length > 0)
        || (Array.isArray(ergonomicsRules.functionalLayoutRules) && ergonomicsRules.functionalLayoutRules.length > 0);
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
      const rating = this.starRatingPolicy.evaluate(score);
      const allViolations = [...styleChannelViolations, ...ergonomicsViolations];
      const feedback = this.feedbackCatalog
        ? await this.feedbackCatalog.getEvaluationFeedback(rating.stars, allViolations)
        : this._generateFeedback(rating.stars, allViolations);

      return EvaluationResultDTO.success({
        score,
        penalty: styleScoring.penalty,
        stars: rating.stars,
        nextThreshold: rating.nextThreshold,
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
