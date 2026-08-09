/**
 * DTO для результата операции удаления предмета из комнаты.
 * Используется для передачи данных из Application слоя в Presentation.
 */
class RemoveResultDTO {
  /**
   * @param {boolean} success 
   * @param {string|null} itemId 
   * @param {number|null} remainingItemCount - Количество оставшихся предметов в комнате
   * @param {string|null} error 
   */
  constructor(success, itemId = null, remainingItemCount = null, error = null) {
    this.success = success;
    this.itemId = itemId;
    this.remainingItemCount = remainingItemCount;
    this.error = error;
    
    // Замораживаем объект для иммутабельности
    Object.freeze(this);
  }

  /**
   * Фабричный метод для успешного результата.
   * @param {string} itemId - ID удаленного предмета
   * @param {number} remainingItemCount - Количество оставшихся предметов
   * @returns {RemoveResultDTO}
   */
  static success(itemId, remainingItemCount) {
    return new RemoveResultDTO(true, itemId, remainingItemCount, null);
  }

  /**
   * Фабричный метод для неудачного результата.
   * @param {string} error - Сообщение об ошибке
   * @param {string|null} itemId - ID предмета (если известен)
   * @returns {RemoveResultDTO}
   */
  static failure(error, itemId = null) {
    return new RemoveResultDTO(false, itemId, null, error);
  }
}

export default RemoveResultDTO;
