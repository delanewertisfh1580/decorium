/**
 * DTO для результата операции перемещения предмета.
 * Используется для передачи данных из Application слоя в Presentation.
 */
class MoveResultDTO {
  /**
   * @param {boolean} success
   * @param {string|null} instanceId
   * @param {Object|null} newPosition
   * @param {string|null} error
   */
  constructor(success, instanceId = null, newPosition = null, error = null) {
    this.success = success;
    this.instanceId = instanceId;
    this.newPosition = newPosition; // { x, y, z }
    this.error = error;
    
    // Замораживаем объект для иммутабельности
    Object.freeze(this);
  }

  static success(instanceId, newPosition) {
    return new MoveResultDTO(true, instanceId, newPosition, null);
  }

  static failure(error, instanceId = null) {
    return new MoveResultDTO(false, instanceId, null, error);
  }
}

export default MoveResultDTO;
