function requireText(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`PassageZone ${name} must be a non-empty string`);
  }
  return value.trim();
}

function positiveNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`PassageZone ${name} must be a positive number`);
  }
  return value;
}

function finiteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`PassageZone ${name} must be a finite number`);
  }
  return value;
}

export class PassageZone {
  constructor({ id, label, x, z, width, depth, weight = 1, messageKey = 'ergonomics-passage-zone-free' }) {
    this._id = requireText(id, 'id');
    this._label = requireText(label, 'label');
    this._x = finiteNumber(x, 'x');
    this._z = finiteNumber(z, 'z');
    this._width = positiveNumber(width, 'width');
    this._depth = positiveNumber(depth, 'depth');
    this._weight = positiveNumber(weight, 'weight');
    this._messageKey = requireText(messageKey, 'messageKey');
    Object.freeze(this);
  }

  get id() { return this._id; }
  get label() { return this._label; }
  get x() { return this._x; }
  get z() { return this._z; }
  get width() { return this._width; }
  get depth() { return this._depth; }
  get weight() { return this._weight; }
  get messageKey() { return this._messageKey; }
}

export default PassageZone;
