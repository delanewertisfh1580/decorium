import InteractionProfile from '../Items/InteractionProfile.js';

const SUPPORTED_KINDS = new Set(['adjacency', 'front-adjacency']);

function validateSelector(selector, label) {
  if (!selector || typeof selector !== 'object' || Array.isArray(selector)
    || typeof selector.affordance !== 'string') {
    throw new Error(`FunctionalLayoutRule ${label} must contain a supported affordance`);
  }
  try {
    new InteractionProfile({ schemaVersion: 1, affordances: [selector.affordance] });
  } catch {
    throw new Error(`FunctionalLayoutRule ${label} must contain a supported affordance`);
  }
  return Object.freeze({ affordance: selector.affordance });
}

export class FunctionalLayoutRule {
  constructor({
    schemaVersion,
    id,
    kind,
    anchorSelector,
    partnerSelector,
    minPartners,
    distance,
    maxAngleDegrees = null,
    weight = 1,
    messageKey
  } = {}) {
    if (schemaVersion !== 1) throw new Error('FunctionalLayoutRule schemaVersion must be 1');
    if (typeof id !== 'string' || id.trim() === '') throw new Error('FunctionalLayoutRule id must be a non-empty string');
    if (!SUPPORTED_KINDS.has(kind)) throw new Error(`FunctionalLayoutRule kind is not supported: ${kind}`);
    if (!Number.isInteger(minPartners) || minPartners < 1) {
      throw new Error('FunctionalLayoutRule minPartners must be a positive integer');
    }
    if (!distance || typeof distance.min !== 'number' || typeof distance.max !== 'number'
      || !Number.isFinite(distance.min) || !Number.isFinite(distance.max) || distance.min < 0 || distance.min >= distance.max) {
      throw new Error('FunctionalLayoutRule distance min must be lower than max');
    }
    if (kind === 'front-adjacency' && (typeof maxAngleDegrees !== 'number'
      || !Number.isFinite(maxAngleDegrees) || maxAngleDegrees <= 0 || maxAngleDegrees > 90)) {
      throw new Error('FunctionalLayoutRule maxAngleDegrees must be greater than 0 and at most 90');
    }
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
      throw new Error('FunctionalLayoutRule weight must be a positive number');
    }
    if (typeof messageKey !== 'string' || messageKey.trim() === '') {
      throw new Error('FunctionalLayoutRule messageKey must be a non-empty string');
    }

    this._schemaVersion = schemaVersion;
    this._id = id.trim();
    this._kind = kind;
    this._anchorSelector = validateSelector(anchorSelector, 'anchorSelector');
    this._partnerSelector = validateSelector(partnerSelector, 'partnerSelector');
    this._minPartners = minPartners;
    this._distance = Object.freeze({ min: distance.min, max: distance.max });
    this._maxAngleDegrees = kind === 'front-adjacency' ? maxAngleDegrees : null;
    this._weight = weight;
    this._messageKey = messageKey.trim();
    Object.freeze(this);
  }

  get schemaVersion() { return this._schemaVersion; }
  get id() { return this._id; }
  get kind() { return this._kind; }
  get anchorSelector() { return this._anchorSelector; }
  get partnerSelector() { return this._partnerSelector; }
  get minPartners() { return this._minPartners; }
  get distance() { return this._distance; }
  get maxAngleDegrees() { return this._maxAngleDegrees; }
  get weight() { return this._weight; }
  get messageKey() { return this._messageKey; }
}

export default FunctionalLayoutRule;
