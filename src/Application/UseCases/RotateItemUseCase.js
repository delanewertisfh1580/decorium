import RotateResultDTO from '../DTOs/RotateResultDTO.js';

/**
 * UseCase для поворота предмета в комнате.
 * 
 * @dependency RoomRepository - порт для сохранения состояния (Infrastructure)
 */
class RotateItemUseCase {
  /**
   * @param {Object} roomRepository 
   */
  constructor(roomRepository) {
    if (!roomRepository) {
      throw new Error('RotateItemUseCase: roomRepository is required.');
    }
    this.roomRepository = roomRepository;
  }

  /**
   * Выполняет поворот предмета.
   * 
   * @param {string} roomId - ID комнаты
   * @param {string} itemId - ID предмета
   * @param {Object} rotationDelta - Изменение угла поворота { x?: number, y?: number, z?: number }
   * @returns {Promise<RotateResultDTO>}
   */
  async execute(roomId, itemId, rotationDelta) {
    // 1. Валидация входных данных
    if (!roomId || typeof roomId !== 'string') {
      return RotateResultDTO.failure('INVALID_INPUT: RoomID is required.');
    }
    if (!itemId || typeof itemId !== 'string') {
      return RotateResultDTO.failure('INVALID_INPUT: ItemID is required.');
    }
    
    // Для MVP требуется Y-ось (горизонтальный поворот)
    if (!rotationDelta || typeof rotationDelta.y !== 'number') {
      return RotateResultDTO.failure('INVALID_INPUT: Rotation must contain y-axis (number).');
    }
    
    // Проверка на кратность 90 градусам
    if (rotationDelta.y % 90 !== 0) {
      return RotateResultDTO.failure('INVALID_INPUT: Rotation angle must be a multiple of 90 degrees.');
    }

    try {
      // 2. Загрузка текущего состояния комнаты
      const roomState = await this.roomRepository.loadRoomState(roomId);
      
      if (!roomState) {
        return RotateResultDTO.failure(`ROOM_NOT_FOUND: Room ${roomId} not found.`);
      }

      // 3. Проверка наличия предмета в комнате
      const item = roomState.getItem(itemId);
      if (!item) {
        return RotateResultDTO.failure(`ITEM_NOT_FOUND: Item ${itemId} not found in room.`);
      }

      // 4. Попытка повернуть предмет через доменную модель
      const newRoomState = roomState.rotateItem(itemId, rotationDelta);

      if (!newRoomState) {
        return RotateResultDTO.failure('ROTATION_REJECTED: Domain rule violation.');
      }

      // 5. Сохранение обновленного состояния
      await this.roomRepository.saveRoomState(roomId, newRoomState);

      // Вычисляем новую ротацию (для MVP предполагаем абсолютную ротацию)
      const newRotation = {
        x: 0,
        y: rotationDelta.y,
        z: 0
      };

      return RotateResultDTO.success(itemId, newRotation);

    } catch (error) {
      console.error(`RotateItemUseCase: Error rotating item ${itemId} in room ${roomId}:`, error);
      return RotateResultDTO.failure(`UNEXPECTED_ERROR: ${error.message}`);
    }
  }
}

export default RotateItemUseCase;
