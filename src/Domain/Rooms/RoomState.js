import { RoomBounds } from './RoomBounds.js';
import ItemConfiguration from './ItemConfiguration.js';
import SurfaceConfiguration from './SurfaceConfiguration.js';

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

function defaultConfigurationFor(item) {
  return item?.baseVariantId ? ItemConfiguration.default(item.baseVariantId) : null;
}

function normalizeConfiguration(item, configuration) {
  if (configuration === null || configuration === undefined) return defaultConfigurationFor(item);
  if (configuration instanceof ItemConfiguration) return configuration;
  if (typeof configuration === 'object') return new ItemConfiguration(configuration);
  throw new Error('Placed item configuration must be an ItemConfiguration, object or null.');
}

class PlacedItem {
  constructor(item, position, rotation, instanceId, configuration = null) {
    if (!item || !isNonEmptyString(item.id)) throw new Error('PlacedItem requires an Item with an id');
    if (!isCanonicalInstanceId(item.id, instanceId)) {
      throw new Error(`PlacedItem instanceId must be canonical for catalog item ${item.id}`);
    }
    const resolvedConfiguration = normalizeConfiguration(item, configuration);
    const resolved = item.resolveConfiguration(resolvedConfiguration);
    this._item = item;
    this._instanceId = instanceId;
    this._configuration = resolvedConfiguration;
    this._resolved = resolved;
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
  get configuration() { return this._configuration; }
  get visual() { return this._resolved.visual; }
  get featureVector() { return this._resolved.featureVector; }
  get position() { return { ...this._position }; }
  get rotation() { return this._rotation; }
  get dimensions() { return { ...this._resolved.dimensions }; }

  toSnapshot() {
    return Object.freeze({
      id: this.id,
      itemId: this.itemId,
      item: this.item,
      configuration: this.configuration?.toJSON() ?? null,
      visual: this.visual,
      featureVector: this.featureVector,
      position: this.position,
      rotation: this.rotation,
      dimensions: this.dimensions
    });
  }
}

export class RoomState {
  constructor(bounds, items = [], surfaceConfiguration = null) {
    if (!(bounds instanceof RoomBounds)) throw new Error('RoomState requires RoomBounds');
    if (!Array.isArray(items) || !items.every(item => item instanceof PlacedItem)) {
      throw new Error('RoomState items must be PlacedItem instances');
    }
    if (surfaceConfiguration !== null && !(surfaceConfiguration instanceof SurfaceConfiguration)) {
      throw new Error('RoomState surfaceConfiguration must be a SurfaceConfiguration or null.');
    }
    const ids = items.map(item => item.id);
    if (new Set(ids).size !== ids.length) throw new Error('RoomState cannot contain duplicate instance IDs');
    this._bounds = bounds;
    this._placedItems = [...items];
    this._surfaceConfiguration = surfaceConfiguration;
  }

  static createEmpty(bounds, surfaceConfiguration = null) {
    return new RoomState(bounds, [], surfaceConfiguration);
  }

  get bounds() { return this._bounds; }
  get width() { return this._bounds.width; }
  get depth() { return this._bounds.depth; }
  get surfaceConfiguration() { return this._surfaceConfiguration; }
  get placedItems() { return this.getItems(); }

  getItems() {
    return this._placedItems.map(placed => placed.toSnapshot());
  }

  getItem(instanceId) {
    return this._placedItems.find(placed => placed.id === instanceId) ?? null;
  }

  getItemsByCatalogItemId(catalogItemId) {
    return this._placedItems
      .filter(placed => placed.itemId === catalogItemId)
      .map(placed => placed.toSnapshot());
  }

  getItemCount() { return this._placedItems.length; }

  _placedIndex(instanceId) {
    return this._placedItems.findIndex(placed => placed.id === instanceId);
  }

  _dimensionsFor(item, rotation = 0, configuration = null) {
    const resolved = item.resolveConfiguration(configuration);
    const dimensions = resolved.dimensions;
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

  validatePlacement(item, position, rotation = 0, configuration = null) {
    if (!item || !isNonEmptyString(item.id) || !position
      || typeof position.x !== 'number' || typeof position.z !== 'number'
      || !Number.isFinite(position.x) || !Number.isFinite(position.z)
      || typeof rotation !== 'number' || !Number.isFinite(rotation) || rotation % 90 !== 0) {
      return RoomOperationResult.failure('INVALID_INPUT');
    }
    try {
      const dimensions = this._dimensionsFor(item, rotation, normalizeConfiguration(item, configuration));
      if (!this._isWithinBounds(position, dimensions)) return RoomOperationResult.failure('OUT_OF_BOUNDS');
      return RoomOperationResult.success();
    } catch (error) {
      return RoomOperationResult.failure(`INVALID_CONFIGURATION: ${error.message}`);
    }
  }

  validateMove(instanceId, newPosition) {
    const placed = this.getItem(instanceId);
    if (!placed) return RoomOperationResult.failure('NOT_FOUND');
    return this.validatePlacement(placed.item, newPosition, placed.rotation, placed.configuration);
  }

  placeItem(item, position, rotation = 0, requestedInstanceId = null, configuration = null) {
    const normalizedConfiguration = normalizeConfiguration(item, configuration);
    const validation = this.validatePlacement(item, position, rotation, normalizedConfiguration);
    if (!validation.success) return validation;
    const instanceId = requestedInstanceId ?? this._nextInstanceId(item.id);
    const identity = this._validateInstanceId(item, instanceId);
    if (!identity.success) return identity;
    this._placedItems.push(new PlacedItem(item, position, rotation, instanceId, normalizedConfiguration));
    return RoomOperationResult.success(Object.freeze({ instanceId }));
  }

  configureItem(instanceId, configuration) {
    const index = this._placedIndex(instanceId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');
    const placed = this._placedItems[index];
    try {
      const nextConfiguration = normalizeConfiguration(placed.item, configuration);
      const validation = this.validatePlacement(placed.item, placed.position, placed.rotation, nextConfiguration);
      if (!validation.success) return validation;
      this._placedItems[index] = new PlacedItem(placed.item, placed.position, placed.rotation, placed.id, nextConfiguration);
      return RoomOperationResult.success(Object.freeze({ instanceId, configuration: nextConfiguration?.toJSON() ?? null }));
    } catch (error) {
      return RoomOperationResult.failure(`INVALID_CONFIGURATION: ${error.message}`);
    }
  }

  configureSurface(surface, finishId) {
    if (!(this.surfaceConfiguration instanceof SurfaceConfiguration)) {
      return RoomOperationResult.failure('SURFACE_CONFIGURATION_UNAVAILABLE');
    }
    try {
      this._surfaceConfiguration = this.surfaceConfiguration.withFinish(surface, finishId);
      return RoomOperationResult.success(Object.freeze({ surface, finishId }));
    } catch (error) {
      return RoomOperationResult.failure(`INVALID_SURFACE_CONFIGURATION: ${error.message}`);
    }
  }

  _findDefaultPosition(item, configuration = null) {
    const dimensions = this._dimensionsFor(item, 0, normalizeConfiguration(item, configuration));
    const step = 0.5;
    for (let z = Math.max(dimensions.z / 2, 0.5); z <= this._bounds.depth - dimensions.z / 2; z += step) {
      for (let x = Math.max(dimensions.x / 2, 0.5); x <= this._bounds.width - dimensions.x / 2; x += step) {
        if (this._isWithinBounds({ x, z }, dimensions)) return { x, y: 0, z };
      }
    }
    return null;
  }

  findAvailablePosition(item, configuration = null) { return this._findDefaultPosition(item, configuration); }

  moveItem(instanceId, newPosition) {
    const index = this._placedIndex(instanceId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');
    const placed = this._placedItems[index];
    const position = {
      x: newPosition?.x,
      y: typeof newPosition?.y === 'number' ? newPosition.y : placed.position.y,
      z: newPosition?.z
    };
    const validation = this.validatePlacement(placed.item, position, placed.rotation, placed.configuration);
    if (!validation.success) return validation;
    this._placedItems[index] = new PlacedItem(placed.item, position, placed.rotation, placed.id, placed.configuration);
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
    const validation = this.validatePlacement(placed.item, placed.position, rotation, placed.configuration);
    if (!validation.success) return validation;
    this._placedItems[index] = new PlacedItem(placed.item, placed.position, rotation, placed.id, placed.configuration);
    return RoomOperationResult.success(Object.freeze({ instanceId }));
  }

  removeItem(instanceId) {
    const index = this._placedIndex(instanceId);
    if (index === -1) return RoomOperationResult.failure('NOT_FOUND');
    this._placedItems.splice(index, 1);
    return RoomOperationResult.success(Object.freeze({ instanceId }));
  }

  clone() {
    const itemCatalog = new Map(this._placedItems.map(placed => [placed.itemId, placed.item]));
    return RoomState.deserialize(this.serialize(), this.bounds, itemCatalog);
  }

  serialize() {
    return Object.freeze({
      schemaVersion: 2,
      bounds: { width: this._bounds.width, depth: this._bounds.depth },
      surfaces: this.surfaceConfiguration?.toJSON() ?? null,
      items: this._placedItems.map(placed => ({
        id: placed.id,
        itemId: placed.itemId,
        configuration: placed.configuration?.toJSON() ?? null,
        position: placed.position,
        rotation: placed.rotation
      }))
    });
  }

  static deserialize(data, bounds, itemCatalog) {
    if (!data || !Array.isArray(data.items)) throw new Error('RoomState snapshot items must be an array');
    if (!(itemCatalog instanceof Map)) throw new Error('RoomState deserialize requires an item catalog Map');
    const surfaceConfiguration = data.surfaces ? new SurfaceConfiguration(data.surfaces) : null;
    const state = RoomState.createEmpty(bounds, surfaceConfiguration);
    for (const itemData of data.items) {
      const itemId = itemData?.itemId;
      const item = itemCatalog.get(itemId);
      if (!item) throw new Error(`RoomState snapshot references unknown catalog item: ${itemId}`);
      const result = state.placeItem(item, itemData.position, itemData.rotation, itemData.id, itemData.configuration ?? null);
      if (!result.success) throw new Error(`RoomState snapshot contains invalid placement: ${result.error}`);
    }
    return state;
  }
}

export default RoomState;
