/**
 * DTO для результата операции перемещения предмета.
 * Используется для передачи данных из Application слоя в Presentation.
 */
class MoveResultDTO {
  /**
   * @param {boolean} success 
   * @param {string|null} itemId 
   * @param {Object|null} newPosition 
   * @param {string|null} error 
   */
  constructor(success, itemId = null, newPosition = null, error = null) {
    this.success = success;
    this.itemId = itemId;
    this.newPosition = newPosition; // { x, y, z }
    this.error = error;
    
    // Замораживаем объект для иммутабельности
    Object.freeze(this);
  }

  static success(itemId, newPosition) {
    return new MoveResultDTO(true, itemId, newPosition, null);
  }

  static failure(error, itemId = null) {
    return new MoveResultDTO(false, itemId, null, error);
  }
}

export default MoveResultDTO;
