import { Item } from '../Items/Item.js';
import { RoomBounds } from './RoomBounds.js';

/**
 * Result object for room operations.
 */
class RoomOperationResult {
  constructor(success, error = null) {
    this.success = success;
    this.error = error;
  }

  static success() {
    return new RoomOperationResult(true);
  }

  static failure(error) {
    return new RoomOperationResult(false, error);
  }
}

/**
 * PlacedItem - represents an item placed in the room with position and rotation.
 */
class PlacedItem {
  #item;
  #position;
  #rotation;

  constructor(item, position, rotation) {
    this.#item = item;
    this.#position = { ...position };
    this.#rotation = rotation;
  }

  get id() {
    return this.#item.id;
  }

  get item() {
    return this.#item;
  }

  get position() {
    return { ...this.#position };
  }

  get rotation() {
    return this.#rotation;
  }

  get dimensions() {
    return this.#item.dimensions;
  }
}

/**
 * RoomState - manages the state of items placed in a room.
 * Handles bounds checking, collision detection, and gap validation.
 */
export class RoomState {
  #placedItems;
  #bounds;

  /**
   * @param {RoomBounds} bounds - Room boundaries
   * @param {PlacedItem[]} [items=[]] - Initial placed items
   */
  constructor(bounds, items = []) {
    if (!(bounds instanceof RoomBounds)) {
      throw new Error('RoomState requires RoomBounds');
    }
    this.#bounds = bounds;
    this.#placedItems = [...items];
  }

  /**
   * Creates an empty room state.
   * @param {RoomBounds} bounds
   * @returns {RoomState}
   */
  static createEmpty(bounds) {
    return new RoomState(bounds, []);
  }

  /**
   * Adds an item at default position (convenience method for tests).
   * @param {Item} item
   * @returns {RoomState} - Returns new RoomState with item added
   */
  addItem(item) {
    const newState = new RoomState(this.#bounds, [...this.#placedItems]);
    const result = newState.placeItem(item, { x: 1, z: 1 }, 0);
    if (!result.success) {
      throw new Error(`Failed to add item: ${result.error}`);
    }
    return newState;
  }

  /**
   * Gets all placed items.
   * @returns {Array}
   */
  getItems() {
    return this.#placedItems.map(pi => ({
      id: pi.id,
      item: pi.item,
      position: pi.position,
      rotation: pi.rotation,
      dimensions: pi.dimensions
    }));
  }

  /**
   * Checks if a position is within room bounds.
   * @param {Object} position - {x, z}
   * @param {Object} dimensions - {x, z}
   * @returns {boolean}
   */
  #isWithinBounds(position, dimensions) {
    const halfX = dimensions.x / 2;
    const halfZ = dimensions.z / 2;
    
    const minX = position.x - halfX;
    const maxX = position.x + halfX;
    const minZ = position.z - halfZ;
    const maxZ = position.z + halfZ;

    return minX >= 0 && maxX <= this.#bounds.width &&
           minZ >= 0 && maxZ <= this.#bounds.height;
  }

  /**
   * Calculates the distance between two placed items' edges.
   * @param {PlacedItem} a
   * @param {PlacedItem} b
   * @returns {number} - Minimum gap between edges (negative if overlapping)
   */
  #calculateGap(a, b) {
    const aHalfX = a.dimensions.x / 2;
    const aHalfZ = a.dimensions.z / 2;
    const bHalfX = b.dimensions.x / 2;
    const bHalfZ = b.dimensions.z / 2;

    // Calculate center distances
    const dx = Math.abs(a.position.x - b.position.x);
    const dz = Math.abs(a.position.z - b.position.z);

    // Calculate edge distances
    const gapX = dx - aHalfX - bHalfX;
    const gapZ = dz - aHalfZ - bHalfZ;

    // Return minimum gap (negative means overlap)
    return Math.min(gapX, gapZ);
  }

  /**
   * Checks for collisions and insufficient gaps.
   * @param {Object} position - {x, z}
   * @param {Object} dimensions - {x, z}
   * @param {string} excludeId - ID to exclude from check
   * @returns {{collision: boolean, insufficientGap: boolean}}
   */
  #checkCollisionsAndGaps(position, dimensions, excludeId = null) {
    const tempItem = {
      id: 'temp',
      dimensions: dimensions
    };
    const tempPlaced = new PlacedItem(tempItem, position, 0);

    for (const placed of this.#placedItems) {
      if (excludeId && placed.id === excludeId) {
        continue;
      }

      const gap = this.#calculateGap(tempPlaced, placed);
      
      if (gap < 0) {
        return { collision: true, insufficientGap: false };
      }
      
      if (gap < 0.9) {
        return { collision: false, insufficientGap: true };
      }
    }

    return { collision: false, insufficientGap: false };
  }

  /**
   * Places an item in the room.
   * @param {Item} item - The item to place
   * @param {Object} position - {x, z} position
   * @param {number} rotation - Rotation in degrees
   * @returns {RoomOperationResult}
   */
  placeItem(item, position, rotation = 0) {
    const dimensions = item.dimensions || { x: 1, z: 1 };

    // Check bounds
    if (!this.#isWithinBounds(position, dimensions)) {
      return RoomOperationResult.failure('OUT_OF_BOUNDS');
    }

    // Check collisions and gaps
    const checks = this.#checkCollisionsAndGaps(position, dimensions);
    if (checks.collision) {
      return RoomOperationResult.failure('COLLISION');
    }
    if (checks.insufficientGap) {
      return RoomOperationResult.failure('INSUFFICIENT_GAP');
    }

    // Place the item
    const placedItem = new PlacedItem(item, position, rotation);
    this.#placedItems.push(placedItem);

    return RoomOperationResult.success();
  }

  /**
   * Moves an item to a new position.
   * @param {string} itemId - ID of the item to move
   * @param {Object} newPosition - {x, z} position
   * @returns {RoomOperationResult}
   */
  moveItem(itemId, newPosition) {
    const placedIndex = this.#placedItems.findIndex(pi => pi.id === itemId);
    if (placedIndex === -1) {
      return RoomOperationResult.failure('NOT_FOUND');
    }

    const placed = this.#placedItems[placedIndex];
    const dimensions = placed.dimensions;

    // Check bounds
    if (!this.#isWithinBounds(newPosition, dimensions)) {
      return RoomOperationResult.failure('OUT_OF_BOUNDS');
    }

    // Check collisions and gaps (excluding current item)
    const checks = this.#checkCollisionsAndGaps(newPosition, dimensions, itemId);
    if (checks.collision) {
      return RoomOperationResult.failure('COLLISION');
    }
    if (checks.insufficientGap) {
      return RoomOperationResult.failure('INSUFFICIENT_GAP');
    }

    // Update position
    this.#placedItems[placedIndex] = new PlacedItem(placed.item, newPosition, placed.rotation);

    return RoomOperationResult.success();
  }

  /**
   * Rotates an item by 90 degrees.
   * @param {string} itemId - ID of the item to rotate
   * @returns {RoomOperationResult}
   */
  rotateItem(itemId) {
    const placedIndex = this.#placedItems.findIndex(pi => pi.id === itemId);
    if (placedIndex === -1) {
      return RoomOperationResult.failure('NOT_FOUND');
    }

    const placed = this.#placedItems[placedIndex];
    const newRotation = (placed.rotation + 90) % 360;

    // Get rotated dimensions
    const originalDimensions = placed.item.dimensions || { x: 1, z: 1 };
    const rotatedDimensions = { x: originalDimensions.z, z: originalDimensions.x };

    // Check bounds with rotated dimensions
    if (!this.#isWithinBounds(placed.position, rotatedDimensions)) {
      return RoomOperationResult.failure('OUT_OF_BOUNDS');
    }

    // Check collisions and gaps with rotated dimensions
    const checks = this.#checkCollisionsAndGaps(placed.position, rotatedDimensions, itemId);
    if (checks.collision) {
      return RoomOperationResult.failure('COLLISION');
    }
    if (checks.insufficientGap) {
      return RoomOperationResult.failure('INSUFFICIENT_GAP');
    }

    // Update rotation
    this.#placedItems[placedIndex] = new PlacedItem(placed.item, placed.position, newRotation);

    return RoomOperationResult.success();
  }

  /**
   * Gets an item by ID.
   * @param {string} itemId
   * @returns {PlacedItem|undefined}
   */
  getItem(itemId) {
    return this.#placedItems.find(pi => pi.id === itemId);
  }

  /**
   * Gets the count of placed items.
   * @returns {number}
   */
  getItemCount() {
    return this.#placedItems.length;
  }

  /**
   * Removes an item from the room.
   * @param {string} itemId - ID of the item to remove
   * @returns {RoomState} - New RoomState with item removed, or null if not found
   */
  removeItem(itemId) {
    const placedIndex = this.#placedItems.findIndex(pi => pi.id === itemId);
    if (placedIndex === -1) {
      return null;
    }

    const newItems = [...this.#placedItems];
    newItems.splice(placedIndex, 1);
    return new RoomState(this.#bounds, newItems);
  }

  /**
   * Serializes the room state to a plain object.
   * @returns {Object}
   */
  serialize() {
    return {
      bounds: {
        width: this.#bounds.width,
        height: this.#bounds.height,
        doors: this.#bounds.doors,
        windows: this.#bounds.windows
      },
      items: this.#placedItems.map(pi => ({
        id: pi.id,
        position: pi.position,
        rotation: pi.rotation
      }))
    };
  }

  /**
   * Deserializes a room state from a plain object.
   * @param {Object} data - Serialized data
   * @param {RoomBounds} bounds - Room bounds
   * @param {Map<string, Item>} itemCatalog - Catalog of items by ID
   * @returns {RoomState}
   */
  static deserialize(data, bounds, itemCatalog) {
    const placedItems = [];
    
    for (const itemData of data.items) {
      const item = itemCatalog.get(itemData.id);
      if (item) {
        placedItems.push(new PlacedItem(item, itemData.position, itemData.rotation));
      }
    }

    return new RoomState(bounds, placedItems);
  }
}
