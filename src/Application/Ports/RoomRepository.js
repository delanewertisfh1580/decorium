/**
 * Port for persisting and retrieving Room State.
 * Implemented by Infrastructure layer.
 */
class RoomRepository {
  /**
   * Saves the current state of the room.
   * @param {string} roomId - Unique identifier of the room.
   * @param {import('../../Domain/Rooms/RoomState.js').default} roomState - The domain object representing room state.
   * @returns {Promise<boolean>} True if saved successfully.
   */
  async saveState(roomId, roomState) {
    throw new Error('Method "saveState" must be implemented by infrastructure.');
  }

  /**
   * Retrieves the state of the room.
   * @param {string} roomId - Unique identifier of the room.
   * @returns {Promise<import('../../Domain/Rooms/RoomState.js').default|null>} The room state or null if not found.
   */
  async getState(roomId) {
    throw new Error('Method "getState" must be implemented by infrastructure.');
  }
}

export default RoomRepository;
