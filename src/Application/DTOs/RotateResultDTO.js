/**
 * DTO для результата операции поворота предмета.
 * Используется для передачи данных из Application слоя в Presentation.
 */
class RotateResultDTO {
  /**
   * @param {boolean} success 
   * @param {string|null} itemId 
   * @param {Object|null} newRotation - Новые углы поворота { x, y, z }
   * @param {string|null} error 
   */
  constructor(success, itemId = null, newRotation = null, error = null) {
    this.success = success;
    this.itemId = itemId;
    this.newRotation = newRotation; // { x, y, z } в градусах
    this.error = error;
    
    // Замораживаем объект для иммутабельности
    Object.freeze(this);
  }

  /**
   * Фабричный метод для успешного результата.
   * @param {string} itemId 
   * @param {Object} newRotation 
   * @returns {RotateResultDTO}
   */
  static success(itemId, newRotation) {
    return new RotateResultDTO(true, itemId, newRotation, null);
  }

  /**
   * Фабричный метод для неудачного результата.
   * @param {string} error 
   * @param {string|null} itemId 
   * @returns {RotateResultDTO}
   */
  static failure(error, itemId = null) {
    return new RotateResultDTO(false, itemId, null, error);
  }
}

export default RotateResultDTO;
