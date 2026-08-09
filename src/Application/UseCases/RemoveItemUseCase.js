import RemoveResultDTO from '../DTOs/RemoveResultDTO.js';

/**
 * UseCase для удаления предмета из комнаты.
 * 
 * @dependency RoomRepository - порт для сохранения состояния (Infrastructure)
 */
class RemoveItemUseCase {
  /**
   * @param {Object} roomRepository 
   */
  constructor(roomRepository) {
    if (!roomRepository) {
      throw new Error('RemoveItemUseCase: roomRepository is required.');
    }
    this.roomRepository = roomRepository;
  }

  /**
   * Выполняет удаление предмета из комнаты.
   * 
   * @param {string} roomId - ID комнаты
   * @param {string} itemId - ID предмета для удаления
   * @returns {Promise<RemoveResultDTO>}
   */
  async execute(roomId, itemId) {
    // 1. Валидация входных данных
    if (!roomId || typeof roomId !== 'string') {
      return RemoveResultDTO.failure('INVALID_INPUT: RoomID is required.');
    }
    if (!itemId || typeof itemId !== 'string') {
      return RemoveResultDTO.failure('INVALID_INPUT: ItemID is required.');
    }

    try {
      // 2. Загрузка текущего состояния комнаты
      const roomState = await this.roomRepository.getState(roomId);
      
      if (!roomState) {
        return RemoveResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      }

      // 3. Проверка наличия предмета в комнате
      const item = roomState.getItem(itemId);
      if (!item) {
        return RemoveResultDTO.failure(`ITEM_NOT_FOUND: Item ${itemId} not found in room.`);
      }

      // 4. Удаляем предмет через доменную модель
      const newRoomState = roomState.removeItem(itemId);

      if (!newRoomState) {
        return RemoveResultDTO.failure('REMOVAL_REJECTED: Domain rule violation.');
      }

      // 5. Сохранение обновленного состояния
      await this.roomRepository.saveState(roomId, newRoomState);

      // Возвращаем успешный результат с количеством оставшихся предметов
      const remainingItemCount = newRoomState.getItemCount();
      return RemoveResultDTO.success(itemId, remainingItemCount);

    } catch (error) {
      console.error(`RemoveItemUseCase: Error removing item ${itemId} from room ${roomId}:`, error);
      return RemoveResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default RemoveItemUseCase;
