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
  constructor(item, position, rotation = 0) {
    this._item = item;
    this._position = { x: position.x, z: position.z };
    this._rotation = rotation;
  }

  get id() { return this._item.id; }
  get item() { return this._item; }
  get featureVector() { return this._item.featureVector; }
  get position() { return { ...this._position }; }
  get rotation() { return this._rotation; }
  get dimensions() { return this._item.dimensions ?? { x: 1, z: 1 }; }
}

export class RoomState {
  constructor(bounds, items = []) {
    if (!(bounds instanceof RoomBounds)) {
      throw new Error('RoomState requires RoomBounds');
    }
    this._bounds = bounds;
    this._placedItems = [...items];
  }

  static createEmpty(bounds) {
    return new RoomState(bounds, []);
  }

  get bounds() { return this._bounds; }
  get width() { return this._bounds.width; }
  get depth() { return this._bounds.depth; }
  get height() { return this._bounds.depth; }
  get placedItems() { return this.getItems(); }

  getItems() {
    return this._placedItems.map(placed => ({
      id: placed.id,
      item: placed.item,
      featureVector: placed.featureVector,
      position: placed.position,
      rotation: placed.rotation,
      dimensions: placed.dimensions
    }));
  }

  getItem(itemId) {
    return this._placedItems.find(placed => placed.id === itemId) ?? null;
  }

  getItemCount() {
    return this._placedItems.length;
  }

  _dimensionsFor(item) {
    return item?.dimensions ?? { x: 1, z: 1 };
  }

  _isWithinBounds(position, dimensions) {
    const halfX = dimensions.x / 2;
    const halfZ = dimensions.z / 2;
    return position.x - halfX >= 0 && position.x + halfX <= this._bounds.width &&
      position.z - halfZ >= 0 && position.z + halfZ <= this._bounds.depth;
  }

  _calculateGap(a, b) {
    const aHalfX = a.dimensions.x / 2;
    const aHalfZ = a.dimensions.z / 2;
    const bHalfX = b.dimensions.x / 2;
    const bHalfZ = b.dimensions.z / 2;
    const dx = Math.abs(a.position.x - b.position.x);
    const dz = Math.abs(a.position.z - b.position.z);
    return Math.min(dx - aHalfX - bHalfX, dz - aHalfZ - bHalfZ);
  }

  _checkCollisionsAndGaps(position, dimensions, excludeId = null) {
    const candidate = { position, dimensions };
    for (const placed of this._placedItems) {
      if (excludeId && placed.id === excludeId) continue;
      const gap = this._calculateGap(candidate, placed);
      if (gap < 0) return { collision: true, insufficientGap: false };
      if (gap < 0.9) return { collision: false, insufficientGap: true };
    }
    return { collision: false, insufficientGap: false };
  }

  placeItem(item, position, rotation = 0) {
    if (!item || !item.id || !position || typeof position.x !== 'number' || typeof position.z !== 'number') {
      return RoomOperationResult.failure('INVALID_INPUT');
    }

    const dimensions = this._dimensionsFor(item);
    if (!this._isWithinBounds(position, dimensions)) {
      return RoomOperationResult.failure('OUT_OF_BOUNDS');
    }

    const checks = this._checkCollisionsAndGaps(position, dimensions);
    if (checks.collision) return RoomOperationResult.failure('COLLISION');
    if (checks.insufficientGap) return RoomOperationResult.failure('INSUFFICIENT_GAP');

    this._placedItems.push(new PlacedItem(item, position, rotation));
    return RoomOperationResult.success();
  }

  _findDefaultPosition(item) {
    const dimensions = this._dimensionsFor(item);
    const step = 0.5;
    for (let z = Math.max(dimensions.z / 2, 0.5); z <= this._bounds.depth - dimensions.z / 2; z += step) {
      for (let x = Math.max(dimensions.x / 2, 0.5); x <= this._bounds.width - dimensions.x / 2; x += step) {
        if (this._isWithinBounds({ x, z }, dimensions)) {
          const checks = this._checkCollisionsAndGaps({ x, z }, dimensions);
          if (!checks.collision && !checks.insufficientGap) return { x, z };
        }
      }
    }
    return null;
  }

  findAvailablePosition(item) {
    return this._findDefaultPosition(item);
  }

  addItem(item) {
    const newState = new RoomState(this._bounds, [...this._placedItems]);
    const position = newState._findDefaultPosition(item);
    if (!position) throw new Error('Failed to add item: ROOM_FULL');
    const result = newState.placeItem(item, position, 0);
    if (!result.success) throw new Error(`Failed to add item: ${result.error}`);
    return newState;
  }

  moveItem(itemId, newPosition) {
    const index = this._placedItems.findIndex(placed => placed.id === itemId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');

    const placed = this._placedItems[index];
    const dimensions = placed.dimensions;
    if (!this._isWithinBounds(newPosition, dimensions)) {
      return RoomOperationResult.failure('OUT_OF_BOUNDS');
    }

    const checks = this._checkCollisionsAndGaps(newPosition, dimensions, itemId);
    if (checks.collision) return RoomOperationResult.failure('COLLISION');
    if (checks.insufficientGap) return RoomOperationResult.failure('INSUFFICIENT_GAP');

    this._placedItems[index] = new PlacedItem(placed.item, newPosition, placed.rotation);
    return RoomOperationResult.success();
  }

  rotateItem(itemId, rotationDelta = 90) {
    const index = this._placedItems.findIndex(placed => placed.id === itemId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');

    const placed = this._placedItems[index];
    const delta = typeof rotationDelta === 'number' ? rotationDelta : rotationDelta.y;
    if (typeof delta !== 'number' || delta % 90 !== 0) {
      return RoomOperationResult.failure('INVALID_ROTATION');
    }

    const rotation = (placed.rotation + delta + 360) % 360;
    const original = placed.dimensions;
    const rotatedDimensions = rotation % 180 === 0
      ? original
      : { x: original.z, z: original.x };

    if (!this._isWithinBounds(placed.position, rotatedDimensions)) {
      return RoomOperationResult.failure('OUT_OF_BOUNDS');
    }

    const checks = this._checkCollisionsAndGaps(placed.position, rotatedDimensions, itemId);
    if (checks.collision) return RoomOperationResult.failure('COLLISION');
    if (checks.insufficientGap) return RoomOperationResult.failure('INSUFFICIENT_GAP');

    this._placedItems[index] = new PlacedItem(placed.item, placed.position, rotation);
    return RoomOperationResult.success();
  }

  removeItem(itemId) {
    const index = this._placedItems.findIndex(placed => placed.id === itemId);
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
        position: placed.position,
        rotation: placed.rotation
      }))
    };
  }

  static deserialize(data, bounds, itemCatalog) {
    const placedItems = [];
    for (const itemData of data.items ?? []) {
      const item = itemCatalog.get(itemData.id);
      if (item) placedItems.push(new PlacedItem(item, itemData.position, itemData.rotation));
    }
    return new RoomState(bounds, placedItems);
  }
}

export default RoomState;
