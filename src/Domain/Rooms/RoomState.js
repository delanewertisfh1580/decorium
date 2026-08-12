import { RoomBounds } from './RoomBounds.js';

class RoomOperationResult {
  constructor(success, error = null) {
    this.success = success;
    this.error = error;
    Object.freeze(this);
  }

  static success() { return new RoomOperationResult(true); }
  static failure(error) { return new RoomOperationResult(false, error); }
}

class PlacedItem {
  constructor(item, position, rotation = 0, instanceId = item.id) {
    this._item = item;
    this._instanceId = instanceId;
    this._position = {
      x: position.x,
      y: typeof position.y === 'number' ? position.y : 0,
      z: position.z
    };
    this._rotation = rotation;
  }

  get id() { return this._instanceId; }
  get itemId() { return this._item.id; }
  get item() { return this._item; }
  get featureVector() { return this._item.featureVector; }
  get position() { return { ...this._position }; }
  get rotation() { return this._rotation; }
  get dimensions() { return this._item.dimensions ?? { x: 1, z: 1 }; }
}

export class RoomState {
  constructor(bounds, items = []) {
    if (!(bounds instanceof RoomBounds)) throw new Error('RoomState requires RoomBounds');
    this._bounds = bounds;
    this._placedItems = [...items];
  }

  static createEmpty(bounds) { return new RoomState(bounds, []); }

  get bounds() { return this._bounds; }
  get width() { return this._bounds.width; }
  get depth() { return this._bounds.depth; }
  get height() { return this._bounds.depth; }
  get placedItems() { return this.getItems(); }

  getItems() {
    return this._placedItems.map(placed => ({
      id: placed.id,
      itemId: placed.itemId,
      item: placed.item,
      featureVector: placed.featureVector,
      position: placed.position,
      rotation: placed.rotation,
      dimensions: placed.dimensions
    }));
  }

  getItem(itemId) {
    return this._placedItems.find(placed => placed.id === itemId || placed.itemId === itemId) ?? null;
  }

  getItemCount() { return this._placedItems.length; }

  _dimensionsFor(item, rotation = 0) {
    const dimensions = item?.dimensions ?? { x: 1, z: 1 };
    return rotation % 180 === 0
      ? dimensions
      : { x: dimensions.z, z: dimensions.x };
  }

  _isWithinBounds(position, dimensions) {
    const halfX = dimensions.x / 2;
    const halfZ = dimensions.z / 2;
    return position.x - halfX >= 0 && position.x + halfX <= this._bounds.width &&
      position.z - halfZ >= 0 && position.z + halfZ <= this._bounds.depth;
  }

  /**
   * Placement rules intentionally only protect the room boundary.
   * Overlap, stacking and small gaps are valid creative choices and are
   * reported by scoring/content rules rather than blocking the interaction.
   */
  validatePlacement(item, position, rotation = 0) {
    if (!item || !item.id || !position ||
        typeof position.x !== 'number' || typeof position.z !== 'number' ||
        Number.isNaN(position.x) || Number.isNaN(position.z)) {
      return RoomOperationResult.failure('INVALID_INPUT');
    }

    const dimensions = this._dimensionsFor(item, rotation);
    if (!this._isWithinBounds(position, dimensions)) return RoomOperationResult.failure('OUT_OF_BOUNDS');
    return RoomOperationResult.success();
  }

  validateMove(itemId, newPosition) {
    const placed = this._placedItems.find(candidate => candidate.id === itemId || candidate.itemId === itemId);
    if (!placed) return RoomOperationResult.failure('NOT_FOUND');
    return this.validatePlacement(placed.item, newPosition, placed.rotation);
  }

  _nextInstanceId(itemId) {
    if (!this._placedItems.some(placed => placed.id === itemId)) return itemId;
    let index = 2;
    while (this._placedItems.some(placed => placed.id === `${itemId}#${index}`)) index += 1;
    return `${itemId}#${index}`;
  }

  placeItem(item, position, rotation = 0, instanceId = null) {
    const validation = this.validatePlacement(item, position, rotation);
    if (!validation.success) return validation;

    this._placedItems.push(new PlacedItem(
      item,
      position,
      rotation,
      instanceId ?? this._nextInstanceId(item.id)
    ));
    return RoomOperationResult.success();
  }

  _findDefaultPosition(item) {
    const dimensions = this._dimensionsFor(item);
    const step = 0.5;
    for (let z = Math.max(dimensions.z / 2, 0.5); z <= this._bounds.depth - dimensions.z / 2; z += step) {
      for (let x = Math.max(dimensions.x / 2, 0.5); x <= this._bounds.width - dimensions.x / 2; x += step) {
        if (this._isWithinBounds({ x, z }, dimensions)) return { x, y: 0, z };
      }
    }
    return null;
  }

  findAvailablePosition(item) { return this._findDefaultPosition(item); }

  addItem(item) {
    const newState = new RoomState(this._bounds, [...this._placedItems]);
    const position = newState._findDefaultPosition(item);
    if (!position) throw new Error('Failed to add item: ROOM_FULL');
    const result = newState.placeItem(item, position, 0);
    if (!result.success) throw new Error(`Failed to add item: ${result.error}`);
    return newState;
  }

  moveItem(itemId, newPosition) {
    const index = this._placedItems.findIndex(placed => placed.id === itemId || placed.itemId === itemId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');

    const placed = this._placedItems[index];
    const position = {
      x: newPosition.x,
      y: typeof newPosition.y === 'number' ? newPosition.y : placed.position.y,
      z: newPosition.z
    };
    const validation = this.validatePlacement(placed.item, position, placed.rotation);
    if (!validation.success) return validation;

    this._placedItems[index] = new PlacedItem(placed.item, position, placed.rotation, placed.id);
    return RoomOperationResult.success();
  }

  rotateItem(itemId, rotationDelta = 90) {
    const index = this._placedItems.findIndex(placed => placed.id === itemId || placed.itemId === itemId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');

    const placed = this._placedItems[index];
    const delta = typeof rotationDelta === 'number' ? rotationDelta : rotationDelta.y;
    if (typeof delta !== 'number' || delta % 90 !== 0) return RoomOperationResult.failure('INVALID_ROTATION');

    const rotation = (placed.rotation + delta + 360) % 360;
    const validation = this.validatePlacement(placed.item, placed.position, rotation);
    if (!validation.success) return validation;

    this._placedItems[index] = new PlacedItem(placed.item, placed.position, rotation, placed.id);
    return RoomOperationResult.success();
  }

  removeItem(itemId) {
    const index = this._placedItems.findIndex(placed => placed.id === itemId || placed.itemId === itemId);
    if (index === -1) return null;
    const items = [...this._placedItems];
    items.splice(index, 1);
    return new RoomState(this._bounds, items);
  }

  serialize() {
    return {
      bounds: { width: this._bounds.width, depth: this._bounds.depth },
      items: this._placedItems.map(placed => ({
        id: placed.id,
        itemId: placed.itemId,
        position: placed.position,
        rotation: placed.rotation
      }))
    };
  }

  static deserialize(data, bounds, itemCatalog) {
    const placedItems = [];
    for (const itemData of data.items ?? []) {
      const item = itemCatalog.get(itemData.itemId ?? itemData.id);
      if (item) placedItems.push(new PlacedItem(
        item,
        itemData.position,
        itemData.rotation,
        itemData.id ?? item.id
      ));
    }
    return new RoomState(bounds, placedItems);
  }
}

export default RoomState;
