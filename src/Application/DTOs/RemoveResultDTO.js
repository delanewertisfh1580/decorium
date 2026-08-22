/**
 * DTO для результата удаления размещённого экземпляра из комнаты.
 * Используется для передачи данных из Application слоя в Presentation.
 */
class RemoveResultDTO {
  /**
   * @param {boolean} success
   * @param {string|null} instanceId - Canonical ID удалённого экземпляра
   * @param {number|null} remainingItemCount - Количество оставшихся предметов
   * @param {string|null} error
   */
  constructor(success, instanceId = null, remainingItemCount = null, error = null) {
    this.success = success;
    this.instanceId = instanceId;
    this.remainingItemCount = remainingItemCount;
    this.error = error;
    Object.freeze(this);
  }

  /**
   * Фабричный метод для успешного результата.
   * @param {string} instanceId - Canonical ID удалённого экземпляра
   * @param {number} remainingItemCount - Количество оставшихся предметов
   * @returns {RemoveResultDTO}
   */
  static success(instanceId, remainingItemCount) {
    return new RemoveResultDTO(true, instanceId, remainingItemCount, null);
  }

  /**
   * Фабричный метод для неудачного результата.
   * @param {string} error - Сообщение об ошибке
   * @param {string|null} instanceId - ID экземпляра (если известен)
   * @returns {RemoveResultDTO}
   */
  static failure(error, instanceId = null) {
    return new RemoveResultDTO(false, instanceId, null, error);
  }
}

export default RemoveResultDTO;
