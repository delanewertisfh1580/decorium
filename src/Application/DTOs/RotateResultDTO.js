/**
 * DTO для результата операции поворота предмета.
 * Используется для передачи данных из Application слоя в Presentation.
 */
class RotateResultDTO {
  /**
   * @param {boolean} success
   * @param {string|null} instanceId
   * @param {Object|null} newRotation - Новые углы поворота { x, y, z }
   * @param {string|null} error
   */
  constructor(success, instanceId = null, newRotation = null, error = null) {
    this.success = success;
    this.instanceId = instanceId;
    this.newRotation = newRotation; // { x, y, z } в градусах
    this.error = error;
    
    // Замораживаем объект для иммутабельности
    Object.freeze(this);
  }

  /**
   * Фабричный метод для успешного результата.
   * @param {string} instanceId
   * @param {Object} newRotation
   * @returns {RotateResultDTO}
   */
  static success(instanceId, newRotation) {
    return new RotateResultDTO(true, instanceId, newRotation, null);
  }

  /**
   * Фабричный метод для неудачного результата.
   * @param {string} error
   * @param {string|null} instanceId
   * @returns {RotateResultDTO}
   */
  static failure(error, instanceId = null) {
    return new RotateResultDTO(false, instanceId, null, error);
  }
}

export default RotateResultDTO;
