/**
 * DTO для результата оценки комнаты.
 * Используется для передачи данных из Application слоя в Presentation.
 */
import { FeatureVector } from '../../Domain/Items/FeatureVector.js';

class EvaluationResultDTO {
  /**
   * @param {boolean} success
   * @param {Object|null} evaluationData
   * @param {string|null} error
   */
  constructor(success, evaluationData = null, error = null) {
    this.success = success;
    this.evaluationData = evaluationData;
    this.error = error;

    // Замораживаем объект для иммутабельности
    Object.freeze(this);
  }

  /**
   * Фабричный метод для успешного результата.
   * @param {Object} evaluationData - Данные оценки
   * @returns {EvaluationResultDTO}
   */
  static success(evaluationData) {
    return new EvaluationResultDTO(true, evaluationData, null);
  }

  /**
   * Фабричный метод для неудачного результата.
   * @param {string} error - Сообщение об ошибке
   * @returns {EvaluationResultDTO}
   */
  static failure(error) {
    return new EvaluationResultDTO(false, null, error);
  }
}

export default EvaluationResultDTO;
