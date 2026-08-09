/**
 * DTO: LevelDTO
 * Data Transfer Object for Level data.
 * Used to pass data between Application and Presentation layers.
 */

class LevelDTO {
  /**
   * @param {string} levelId
   * @param {string} roomId
   * @param {Object} roomState - Instance of RoomState
   * @param {Array} availableItems - Array of Item instances
   * @param {Array} constraints - Array of LinearConstraint instances
   * @param {string} styleId
   */
  constructor(levelId, roomId, roomState, availableItems, constraints, styleId) {
    if (!levelId || typeof levelId !== 'string') {
      throw new Error('LevelDTO: levelId is required and must be a string.');
    }
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('LevelDTO: roomId is required and must be a string.');
    }
    if (!roomState) {
      throw new Error('LevelDTO: roomState is required.');
    }
    if (!Array.isArray(availableItems)) {
      throw new Error('LevelDTO: availableItems must be an array.');
    }
    if (!Array.isArray(constraints)) {
      throw new Error('LevelDTO: constraints must be an array.');
    }
    if (!styleId || typeof styleId !== 'string') {
      throw new Error('LevelDTO: styleId is required and must be a string.');
    }

    this.levelId = levelId;
    this.roomId = roomId;
    this.roomState = roomState;
    this.availableItems = availableItems;
    this.constraints = constraints;
    this.styleId = styleId;
  }
}

export default LevelDTO;
