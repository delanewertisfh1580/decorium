/**
 * Data Transfer Object for the result of placing an item.
 */
class PlacementResultDTO {
  /**
   * @param {boolean} success - Whether the operation was successful.
   * @param {string|null} [itemId=null] - ID of the placed item.
   * @param {Object|null} [position=null] - Position vector {x, y, z}.
   * @param {Object|null} [rotation=null] - Rotation quaternion or euler {x, y, z, w}.
   * @param {string|null} [error=null] - Error message if failed.
   */
  constructor(success, itemId = null, position = null, rotation = null, error = null) {
    this.success = success;
    this.itemId = itemId;
    this.position = position;
    this.rotation = rotation;
    this.error = error;
    
    // Freeze to ensure immutability
    Object.freeze(this);
  }

  static failure(error) {
    return new PlacementResultDTO(false, null, null, null, error);
  }

  static success(itemId, position, rotation) {
    return new PlacementResultDTO(true, itemId, position, rotation, null);
  }
}

export default PlacementResultDTO;
