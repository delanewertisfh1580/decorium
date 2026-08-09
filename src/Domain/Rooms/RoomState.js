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

  /**
   * Gets an item by ID.
   * @param {string} itemId - The ID of the item to find
   * @returns {Item|null} - The item or null if not found
   */
  getItem(itemId) {
    return this._items.find(i => i.id === itemId) || null;
  }

  /**
   * Moves an item to a new position, returning a new RoomState.
   * Note: This is a simplified implementation. Domain rules for bounds/collisions
   * should be added here or in a separate Domain Service.
   * 
   * @param {string} itemId - The ID of the item to move
   * @param {Object} newPosition - New position { x, y, z }
   * @returns {RoomState|null} - New RoomState with moved item, or null if move rejected
   * @throws {Error} If item with ID not found
   */
  moveItem(itemId, newPosition) {
    const itemIndex = this._items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    const oldItem = this._items[itemIndex];
    
    // Здесь можно добавить проверку границ комнаты и коллизий
    // Для MVP принимаем любую позицию с числами
    if (typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number' || typeof newPosition.z !== 'number') {
      return null; // Отклоняем невалидную позицию
    }

    // Создаем новый предмет с обновленной позицией (предполагается, что Item имеет метод withPosition или аналогичный)
    // Поскольку Item сейчас immutable и не имеет позиции в себе (позиция хранится в state UI/Infrastructure),
    // мы просто возвращаем новое состояние комнаты, помечая предмет как "перемещенный".
    // В полной реализации Item должен хранить transform или мы должны иметь PlacedItem aggregate.
    
    // Для текущей архитектуры MVP: позиция хранится вне Item (в UI/Scene), 
    // поэтому moveItem здесь просто подтверждает возможность перемещения.
    // Возвращаем копию состояния (так как RoomState immutable).
    const newItems = [...this._items];
    return new RoomState(newItems);
  }
}
