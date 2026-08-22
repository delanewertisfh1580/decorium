import { RoomBounds } from './RoomBounds.js';

class RoomOperationResult {
  constructor(success, error = null, data = null) {
    this.success = success;
    this.error = error;
    this.data = data;
    Object.freeze(this);
  }

  static success(data = null) { return new RoomOperationResult(true, null, data); }
  static failure(error) { return new RoomOperationResult(false, error); }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function instanceIdFor(itemId, ordinal) {
  return `${itemId}#${ordinal}`;
}

function isCanonicalInstanceId(itemId, instanceId) {
  if (!isNonEmptyString(instanceId)) return false;
  const prefix = `${itemId}#`;
  if (!instanceId.startsWith(prefix)) return false;
  const ordinal = Number(instanceId.slice(prefix.length));
  return Number.isInteger(ordinal) && ordinal > 0 && String(ordinal) === instanceId.slice(prefix.length);
}

class PlacedItem {
  constructor(item, position, rotation, instanceId) {
    if (!item || !isNonEmptyString(item.id)) throw new Error('PlacedItem requires an Item with an id');
    if (!isCanonicalInstanceId(item.id, instanceId)) {
      throw new Error(`PlacedItem instanceId must be canonical for catalog item ${item.id}`);
    }
    this._item = item;
    this._instanceId = instanceId;
    this._position = Object.freeze({
      x: position.x,
      y: typeof position.y === 'number' ? position.y : 0,
      z: position.z
    });
    this._rotation = rotation;
    Object.freeze(this);
  }

  get id() { return this._instanceId; }
  get itemId() { return this._item.id; }
  get item() { return this._item; }
  get featureVector() { return this._item.featureVector; }
  get position() { return { ...this._position }; }
  get rotation() { return this._rotation; }
  get dimensions() { return this._item.dimensions ?? { x: 1, z: 1 }; }

  toSnapshot() {
    return {
      id: this.id,
      itemId: this.itemId,
      item: this.item,
      featureVector: this.featureVector,
      position: this.position,
      rotation: this.rotation,
      dimensions: this.dimensions
    };
  }
}

export class RoomState {
  constructor(bounds, items = []) {
    if (!(bounds instanceof RoomBounds)) throw new Error('RoomState requires RoomBounds');
    if (!Array.isArray(items) || !items.every(item => item instanceof PlacedItem)) {
      throw new Error('RoomState items must be PlacedItem instances');
    }
    const ids = items.map(item => item.id);
    if (new Set(ids).size !== ids.length) throw new Error('RoomState cannot contain duplicate instance IDs');
    this._bounds = bounds;
    this._placedItems = [...items];
  }

  static createEmpty(bounds) { return new RoomState(bounds, []); }

  get bounds() { return this._bounds; }
  get width() { return this._bounds.width; }
  get depth() { return this._bounds.depth; }
  get placedItems() { return this.getItems(); }

  getItems() {
    return this._placedItems.map(placed => placed.toSnapshot());
  }

  /** Returns one placed instance by its canonical instance ID. */
  getItem(instanceId) {
    return this._placedItems.find(placed => placed.id === instanceId) ?? null;
  }

  /** Returns every placed instance of one catalog item. This method is read-only. */
  getItemsByCatalogItemId(catalogItemId) {
    return this._placedItems
      .filter(placed => placed.itemId === catalogItemId)
      .map(placed => placed.toSnapshot());
  }

  getItemCount() { return this._placedItems.length; }

  _placedIndex(instanceId) {
    return this._placedItems.findIndex(placed => placed.id === instanceId);
  }

  _dimensionsFor(item, rotation = 0) {
    const dimensions = item?.dimensions ?? { x: 1, z: 1 };
    return rotation % 180 === 0 ? dimensions : { x: dimensions.z, z: dimensions.x };
  }

  _isWithinBounds(position, dimensions) {
    const halfX = dimensions.x / 2;
    const halfZ = dimensions.z / 2;
    return position.x - halfX >= 0 && position.x + halfX <= this._bounds.width
      && position.z - halfZ >= 0 && position.z + halfZ <= this._bounds.depth;
  }

  _nextInstanceId(itemId) {
    let ordinal = 1;
    while (this._placedItems.some(placed => placed.id === instanceIdFor(itemId, ordinal))) ordinal += 1;
    return instanceIdFor(itemId, ordinal);
  }

  _validateInstanceId(item, instanceId) {
    if (!isCanonicalInstanceId(item.id, instanceId)) return RoomOperationResult.failure('INVALID_INSTANCE_ID');
    if (this.getItem(instanceId)) return RoomOperationResult.failure('DUPLICATE_INSTANCE_ID');
    return RoomOperationResult.success();
  }

  /**
   * Placement protects room bounds only. Overlap, stacking and small gaps remain
   * creative choices evaluated by scoring/content rules rather than blocked here.
   */
  validatePlacement(item, position, rotation = 0) {
    if (!item || !isNonEmptyString(item.id) || !position
      || typeof position.x !== 'number' || typeof position.z !== 'number'
      || !Number.isFinite(position.x) || !Number.isFinite(position.z)
      || typeof rotation !== 'number' || !Number.isFinite(rotation) || rotation % 90 !== 0) {
      return RoomOperationResult.failure('INVALID_INPUT');
    }

    const dimensions = this._dimensionsFor(item, rotation);
    if (!this._isWithinBounds(position, dimensions)) return RoomOperationResult.failure('OUT_OF_BOUNDS');
    return RoomOperationResult.success();
  }

  validateMove(instanceId, newPosition) {
    const placed = this.getItem(instanceId);
    if (!placed) return RoomOperationResult.failure('NOT_FOUND');
    return this.validatePlacement(placed.item, newPosition, placed.rotation);
  }

  placeItem(item, position, rotation = 0, requestedInstanceId = null) {
    const validation = this.validatePlacement(item, position, rotation);
    if (!validation.success) return validation;

    const instanceId = requestedInstanceId ?? this._nextInstanceId(item.id);
    const identity = this._validateInstanceId(item, instanceId);
    if (!identity.success) return identity;

    this._placedItems.push(new PlacedItem(item, position, rotation, instanceId));
    return RoomOperationResult.success(Object.freeze({ instanceId }));
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

  moveItem(instanceId, newPosition) {
    const index = this._placedIndex(instanceId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');

    const placed = this._placedItems[index];
    const position = {
      x: newPosition?.x,
      y: typeof newPosition?.y === 'number' ? newPosition.y : placed.position.y,
      z: newPosition?.z
    };
    const validation = this.validatePlacement(placed.item, position, placed.rotation);
    if (!validation.success) return validation;

    this._placedItems[index] = new PlacedItem(placed.item, position, placed.rotation, placed.id);
    return RoomOperationResult.success(Object.freeze({ instanceId }));
  }

  rotateItem(instanceId, rotationDelta = 90) {
    const index = this._placedIndex(instanceId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');

    const placed = this._placedItems[index];
    const delta = typeof rotationDelta === 'number' ? rotationDelta : rotationDelta?.y;
    if (typeof delta !== 'number' || !Number.isFinite(delta) || delta % 90 !== 0) {
      return RoomOperationResult.failure('INVALID_ROTATION');
    }

    const rotation = (placed.rotation + delta + 360) % 360;
    const validation = this.validatePlacement(placed.item, placed.position, rotation);
    if (!validation.success) return validation;

    this._placedItems[index] = new PlacedItem(placed.item, placed.position, rotation, placed.id);
    return RoomOperationResult.success(Object.freeze({ instanceId }));
  }

  removeItem(instanceId) {
    const index = this._placedIndex(instanceId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');
    this._placedItems.splice(index, 1);
    return RoomOperationResult.success(Object.freeze({ instanceId }));
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
    if (!data || !Array.isArray(data.items)) throw new Error('RoomState snapshot items must be an array');
    if (!(itemCatalog instanceof Map)) throw new Error('RoomState deserialize requires an item catalog Map');

    const state = RoomState.createEmpty(bounds);
    for (const itemData of data.items) {
      const itemId = itemData?.itemId;
      const item = itemCatalog.get(itemId);
      if (!item) throw new Error(`RoomState snapshot references unknown catalog item: ${itemId}`);
      const result = state.placeItem(item, itemData.position, itemData.rotation, itemData.id);
      if (!result.success) throw new Error(`RoomState snapshot contains invalid placement: ${result.error}`);
    }
    return state;
  }
}

export default RoomState;
