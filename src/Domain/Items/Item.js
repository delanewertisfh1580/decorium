import { FeatureVector } from './FeatureVector.js';
import InteractionProfile from './InteractionProfile.js';
import SpatialBehavior from './SpatialBehavior.js';

export class Item {
  constructor({
    id,
    name,
    type,
    featureVector,
    dimensions,
    price = 0,
    interactionProfile = InteractionProfile.empty(),
    spatialBehavior = SpatialBehavior.defaultFloorObstacle()
  }) {
    if (id === undefined || id === null) throw new Error('Item ID is required');
    if (typeof id !== 'string' || id.trim() === '') throw new Error('Item ID cannot be empty');
    if (!name) throw new Error('Item name is required');
    if (!type) throw new Error('Item type is required');
    if (featureVector === undefined || featureVector === null) {
      throw new Error('Item featureVector is required');
    }
    if (!(featureVector instanceof FeatureVector)) {
      throw new Error('featureVector must be an instance of FeatureVector');
    }
    if (!(interactionProfile instanceof InteractionProfile)) {
      throw new Error('Item interactionProfile must be an instance of InteractionProfile');
    }
    if (!(spatialBehavior instanceof SpatialBehavior)) {
      throw new Error('Item spatialBehavior must be an instance of SpatialBehavior');
    }
    if (dimensions !== undefined && (!dimensions || typeof dimensions.x !== 'number' || typeof dimensions.z !== 'number')) {
      throw new Error('Item dimensions must contain numeric x and z values');
    }

    this._id = id.trim();
    this._name = name;
    this._type = type;
    this._featureVector = featureVector;
    this._dimensions = dimensions;
    this._price = price;
    this._interactionProfile = interactionProfile;
    this._spatialBehavior = spatialBehavior;
    Object.freeze(this);
  }

  get id() { return this._id; }
  get name() { return this._name; }
  get type() { return this._type; }
  get typeId() { return this._type; }
  get featureVector() { return this._featureVector; }
  get dimensions() { return this._dimensions; }
  get price() { return this._price; }
  get interactionProfile() { return this._interactionProfile; }
  get spatialBehavior() { return this._spatialBehavior; }
}

export default Item;
