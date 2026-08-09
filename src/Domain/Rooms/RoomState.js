import { Item } from '../Items/Item.js';

/**
 * Value Object representing the state of a room.
 * Immutable: all modification methods return a new instance.
 */
export class RoomState {
  /**
   * @private
   * @param {Item[]} items - Array of placed items
   */
  constructor(items) {
    Object.freeze(items);
    this._items = items;
  }

  /**
   * Creates an empty room state.
   * @returns {RoomState}
   */
  static createEmpty() {
    return new RoomState([]);
  }

  /**
   * Gets all items in the room.
   * @returns {Item[]}
   */
  getItems() {
    return [...this._items];
  }

  /**
   * Gets the count of items in the room.
   * @returns {number}
   */
  getItemCount() {
    return this._items.length;
  }

  /**
   * Adds an item to the room, returning a new RoomState.
   * @param {Item} item - The item to add
   * @returns {RoomState} - New RoomState with the item added
   * @throws {Error} If item with same ID already exists
   */
  addItem(item) {
    if (!(item instanceof Item)) {
      throw new Error('Only Item instances can be added to RoomState');
    }

    const existingIndex = this._items.findIndex(i => i.id === item.id);
    if (existingIndex !== -1) {
      throw new Error(`Item with ID ${item.id} already exists`);
    }

    const newItems = [...this._items, item];
    return new RoomState(newItems);
  }

  /**
   * Removes an item by ID, returning a new RoomState.
   * @param {string} itemId - The ID of the item to remove
   * @returns {RoomState} - New RoomState with the item removed
   * @throws {Error} If item with ID not found
   */
  removeItem(itemId) {
    const existingIndex = this._items.findIndex(i => i.id === itemId);
    if (existingIndex === -1) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    const newItems = [
      ...this._items.slice(0, existingIndex),
      ...this._items.slice(existingIndex + 1)
    ];
    return new RoomState(newItems);
  }
}
