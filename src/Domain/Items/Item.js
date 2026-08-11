import { FeatureVector } from './FeatureVector.js';

export class Item {
  constructor({ id, name, type, featureVector, dimensions, price = 0 }) {
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
    if (dimensions !== undefined && (!dimensions || typeof dimensions.x !== 'number' || typeof dimensions.z !== 'number')) {
      throw new Error('Item dimensions must contain numeric x and z values');
    }

    this._id = id.trim();
    this._name = name;
    this._type = type;
    this._featureVector = featureVector;
    this._dimensions = dimensions;
    this._price = price;
    Object.freeze(this);
  }

  get id() { return this._id; }
  get name() { return this._name; }
  get type() { return this._type; }
  get typeId() { return this._type; }
  get featureVector() { return this._featureVector; }
  get dimensions() { return this._dimensions; }
  get price() { return this._price; }
}

export default Item;
