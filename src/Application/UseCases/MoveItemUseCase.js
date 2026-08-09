import MoveResultDTO from '../DTOs/MoveResultDTO.js';

/**
 * UseCase для перемещения предмета в комнате.
 * 
 * @dependency RoomRepository - порт для сохранения состояния (Infrastructure)
 */
export class MoveItemUseCase {
  /**
   * @param {Object} roomRepository 
   */
  constructor(roomRepository) {
    if (!roomRepository) {
      throw new Error('MoveItemUseCase: roomRepository is required.');
    }
    this.roomRepository = roomRepository;
  }

  /**
   * Выполняет перемещение предмета.
   * 
   * @param {string} roomId - ID комнаты
   * @param {string} itemId - ID предмета
   * @param {Object} newPosition - Новые координаты { x, y, z }
   * @returns {Promise<MoveResultDTO>}
   */
  async execute(roomId, itemId, newPosition) {
    // 1. Валидация входных данных
    if (!roomId || typeof roomId !== 'string') {
      return MoveResultDTO.failure('INVALID_INPUT: RoomID is required.');
    }
    if (!itemId || typeof itemId !== 'string') {
      return MoveResultDTO.failure('INVALID_INPUT: ItemID is required.');
    }
    if (!newPosition || typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number' || typeof newPosition.z !== 'number') {
      return MoveResultDTO.failure('INVALID_INPUT: New position must contain x, y, z numbers.');
    }

    try {
      // 2. Загрузка текущего состояния комнаты
      const roomState = await this.roomRepository.loadRoomState(roomId);
      
      if (!roomState) {
        return MoveResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      }

      // 3. Проверка наличия предмета в комнате (Domain logic)
      const item = roomState.getItem(itemId);
      if (!item) {
        return MoveResultDTO.failure(`ITEM_NOT_FOUND: Item ${itemId} not found in room.`);
      }

      // 4. Попытка переместить предмет через доменную модель
      // Domain слой проверит границы комнаты и коллизии (если реализовано)
      const moveSuccess = roomState.moveItem(itemId, newPosition);

      if (!moveSuccess) {
        return MoveResultDTO.failure('MOVE_REJECTED: Domain rule violation (e.g., out of bounds or collision).');
      }

      // 5. Сохранение обновленного состояния
      await this.roomRepository.saveRoomState(roomId, roomState);

      return MoveResultDTO.success(itemId, newPosition);

    } catch (error) {
      console.error(`MoveItemUseCase: Error moving item ${itemId} in room ${roomId}:`, error);
      return MoveResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default MoveItemUseCase;
