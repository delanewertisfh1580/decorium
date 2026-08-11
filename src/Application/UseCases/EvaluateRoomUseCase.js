import EvaluationResultDTO from '../DTOs/EvaluationResultDTO.js';
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';

export class EvaluateRoomUseCase {
  constructor(roomRepository, constraintEvaluator, styleScorer, starRatingPolicy, feedbackCatalog = null) {
    if (!roomRepository) throw new Error('EvaluateRoomUseCase: roomRepository is required.');
    if (!constraintEvaluator) throw new Error('EvaluateRoomUseCase: constraintEvaluator is required.');
    if (!styleScorer) throw new Error('EvaluateRoomUseCase: styleScorer is required.');
    if (!starRatingPolicy) throw new Error('EvaluateRoomUseCase: starRatingPolicy is required.');
    this.roomRepository = roomRepository;
    this.constraintEvaluator = constraintEvaluator;
    this.styleScorer = styleScorer;
    this.starRatingPolicy = starRatingPolicy;
    this.feedbackCatalog = feedbackCatalog;
  }

  async execute(roomId, constraints) {
    if (!roomId || typeof roomId !== 'string') return EvaluationResultDTO.failure('INVALID_INPUT: RoomID is required.');
    if (!Array.isArray(constraints)) return EvaluationResultDTO.failure('INVALID_INPUT: Constraints must be an array.');

    try {
      const roomState = await this.roomRepository.getState(roomId);
      if (!roomState) return EvaluationResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);

      const placedItems = roomState.getItems();
      if (placedItems.length === 0) {
        return EvaluationResultDTO.success({
          score: 0,
          penalty: 1,
          stars: 0,
          nextThreshold: 0.4,
          violations: [],
          itemCount: 0,
          roomVector: null,
          feedback: 'Комната пуста (Room is empty). Добавьте предметы, чтобы получить оценку.'
        });
      }

      const roomVector = FeatureVector.average(placedItems.map(placed => placed.featureVector));
      const evaluations = this.constraintEvaluator.evaluateAll(constraints, roomVector);
      const violations = evaluations.filter(result => !result.isSatisfied).map(result => result.violation);
      const scoring = this.styleScorer.evaluate(violations);
      const rating = this.starRatingPolicy.evaluate(scoring.score);
      const feedback = this.feedbackCatalog
        ? await this.feedbackCatalog.getEvaluationFeedback(rating.stars, violations)
        : this._generateFeedback(rating.stars, violations);

      return EvaluationResultDTO.success({
        score: scoring.score,
        penalty: scoring.penalty,
        stars: rating.stars,
        nextThreshold: rating.nextThreshold,
        violations: violations.map(violation => ({
          id: violation.constraintId,
          feature: violation.featureName,
          operator: violation.operator,
          threshold: violation.threshold,
          actualValue: violation.actualValue,
          severity: violation.severity,
          messageKey: violation.messageKey,
          message: violation.constraint.description
        })),
        itemCount: placedItems.length,
        roomVector: roomVector.toArray(),
        feedback
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
    if (stars >= 2) return 'The room needs significant changes to match the desired style.';
    if (stars >= 1) return 'Poor result. Try reviewing the style guidelines and rearranging items.';
    return 'Very poor. Start by placing items that match the style constraints.';
  }
}

export default EvaluateRoomUseCase;
