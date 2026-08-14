export class MinimumClearanceRule {
  constructor({
    id = 'ergonomics-minimum-clearance',
    minimumDistance,
    weight = 1,
    messageKey = 'ergonomics-minimum-clearance'
  }) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('MinimumClearanceRule id must be a non-empty string');
    }
    if (typeof minimumDistance !== 'number' || !Number.isFinite(minimumDistance) || minimumDistance <= 0) {
      throw new Error('MinimumClearanceRule minimumDistance must be a positive number');
    }
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
      throw new Error('MinimumClearanceRule weight must be a positive number');
    }
    if (typeof messageKey !== 'string' || messageKey.trim() === '') {
      throw new Error('MinimumClearanceRule messageKey must be a non-empty string');
    }

    this._id = id.trim();
    this._minimumDistance = minimumDistance;
    this._weight = weight;
    this._messageKey = messageKey.trim();
    Object.freeze(this);
  }

  get id() { return this._id; }
  get minimumDistance() { return this._minimumDistance; }
  get weight() { return this._weight; }
  get messageKey() { return this._messageKey; }
}

export default MinimumClearanceRule;
