/**
 * UseCase для финальной оценки комнаты.
 *
 * @dependency RoomRepository - порт для загрузки состояния комнаты
 * @dependency ConstraintEvaluator - доменный сервис для проверки ограничений
 * @dependency StyleScorer - доменный сервис для расчета стиля score
 * @dependency StarRatingPolicy - доменная политика для расчета звезд
 */
import EvaluationResultDTO from '../DTOs/EvaluationResultDTO.js';
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';

class EvaluateRoomUseCase {
  /**
   * @param {Object} roomRepository
   * @param {Object} constraintEvaluator
   * @param {Object} styleScorer
   * @param {Object} starRatingPolicy
   */
  constructor(roomRepository, constraintEvaluator, styleScorer, starRatingPolicy) {
    if (!roomRepository) {
      throw new Error('EvaluateRoomUseCase: roomRepository is required.');
    }
    if (!constraintEvaluator) {
      throw new Error('EvaluateRoomUseCase: constraintEvaluator is required.');
    }
    if (!styleScorer) {
      throw new Error('EvaluateRoomUseCase: styleScorer is required.');
    }
    if (!starRatingPolicy) {
      throw new Error('EvaluateRoomUseCase: starRatingPolicy is required.');
    }

    this.roomRepository = roomRepository;
    this.constraintEvaluator = constraintEvaluator;
    this.styleScorer = styleScorer;
    this.starRatingPolicy = starRatingPolicy;
  }

  /**
   * Выполняет оценку комнаты.
   *
   * @param {string} roomId - ID комнаты
   * @param {Array} constraints - Массив ограничений для проверки
   * @returns {Promise<EvaluationResultDTO>}
   */
  async execute(roomId, constraints) {
    // 1. Валидация входных данных
    if (!roomId || typeof roomId !== 'string') {
      return EvaluationResultDTO.failure('INVALID_INPUT: RoomID is required.');
    }

    if (!Array.isArray(constraints)) {
      return EvaluationResultDTO.failure('INVALID_INPUT: Constraints must be an array.');
    }

    try {
      // 2. Загрузка текущего состояния комнаты
      const roomState = await this.roomRepository.getState(roomId);

      if (!roomState) {
        return EvaluationResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      }

      // 3. Получаем все размещенные предметы
      const placedItems = roomState.getItems();

      // 4. Если предметов нет, возвращаем минимальную оценку
      if (placedItems.length === 0) {
        const evaluationData = {
          score: 0,
          stars: 0,
          violations: [],
          itemCount: 0,
          feedback: 'Room is empty. Place some items to get a rating.'
        };
        return EvaluationResultDTO.success(evaluationData);
      }

      // 5. Вычисляем вектор комнаты (средний вектор всех предметов)
      const featureVectors = placedItems.map(item => item.featureVector);
      const roomVector = FeatureVector.average(featureVectors);

      // 6. Проверяем ограничения
      const evaluationResults = this.constraintEvaluator.evaluateAll(constraints, roomVector);
      const violations = evaluationResults
        .filter(result => !result.isSatisfied)
        .map(result => result.violation);

      // 7. Рассчитываем штраф и стиль score
      const scoringResult = this.styleScorer.evaluate(violations);

      // 8. Определяем рейтинг звезд
      const starResult = this.starRatingPolicy.evaluate(scoringResult.score);

      // 9. Формируем обратную связь
      const feedback = this._generateFeedback(starResult.stars, violations);

      // 10. Возвращаем полный результат оценки
      const evaluationData = {
        score: scoringResult.score,
        penalty: scoringResult.penalty,
        stars: starResult.stars,
        nextThreshold: starResult.nextThreshold,
        violations: violations.map(v => ({
          constraint: v.constraint.description,
          severity: v.severity,
          message: v.message
        })),
        itemCount: placedItems.length,
        roomVector: roomVector.toArray(),
        feedback
      };

      return EvaluationResultDTO.success(evaluationData);

    } catch (error) {
      console.error(`EvaluateRoomUseCase: Error evaluating room ${roomId}:`, error);
      return EvaluationResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }

  /**
   * Генерирует текстовую обратную связь на основе результата.
   * @param {number} stars - Количество звезд
   * @param {Array} violations - Массив нарушений
   * @returns {string}
   */
  _generateFeedback(stars, violations) {
    if (stars >= 5) {
      return 'Excellent! Your room design perfectly matches the style.';
    } else if (stars >= 4) {
      return 'Great job! The room looks good with minor improvements needed.';
    } else if (stars >= 3) {
      return 'Not bad. Some adjustments could improve the overall style.';
    } else if (stars >= 2) {
      return 'The room needs significant changes to match the desired style.';
    } else if (stars >= 1) {
      return 'Poor result. Try reviewing the style guidelines and rearranging items.';
    } else {
      return 'Very poor. Start by placing items that match the style constraints.';
    }
  }
}

export default EvaluateRoomUseCase;
