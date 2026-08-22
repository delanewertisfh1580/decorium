import { FeatureVector } from './FeatureVector.js';

function requireIdentifier(value, label) {
  if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`ItemVariant ${label} must be a lowercase identifier.`);
  }
  return value;
}

function freezeDimensions(dimensions) {
  if (dimensions === undefined || dimensions === null) return null;
  if (!dimensions || typeof dimensions.x !== 'number' || typeof dimensions.z !== 'number'
    || dimensions.x <= 0 || dimensions.z <= 0) {
    throw new Error('ItemVariant dimensions must contain positive x and z values.');
  }
  return Object.freeze({ x: dimensions.x, z: dimensions.z });
}

function freezeVisual(visual) {
  if (!visual || typeof visual.materialId !== 'string' || !/^[a-z0-9-]+$/.test(visual.materialId)
    || typeof visual.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(visual.color)) {
    throw new Error('ItemVariant visual must define materialId and a #RRGGBB color.');
  }
  const scale = visual.scale ?? 1;
  if (typeof scale !== 'number' || scale < 0.5 || scale > 2) {
    throw new Error('ItemVariant visual scale must be between 0.5 and 2.');
  }
  if (visual.assetId !== undefined && visual.assetId !== null && typeof visual.assetId !== 'string') {
    throw new Error('ItemVariant visual assetId must be a string or null.');
  }
  return Object.freeze({
    materialId: visual.materialId,
    color: visual.color.toLowerCase(),
    assetId: visual.assetId ?? null,
    scale
  });
}

export class ItemVariant {
  constructor({ id, label, unlockId, visual, dimensions = null, featureVector = null }) {
    this._id = requireIdentifier(id, 'id');
    if (typeof label !== 'string' || label.trim() === '') throw new Error('ItemVariant label is required.');
    this._label = label.trim();
    this._unlockId = requireIdentifier(unlockId, 'unlockId');
    this._visual = freezeVisual(visual);
    this._dimensions = freezeDimensions(dimensions);
    if (featureVector !== null && !(featureVector instanceof FeatureVector)) {
      throw new Error('ItemVariant featureVector must be a FeatureVector or null.');
    }
    this._featureVector = featureVector;
    Object.freeze(this);
  }

  get id() { return this._id; }
  get label() { return this._label; }
  get unlockId() { return this._unlockId; }
  get visual() { return this._visual; }
  get dimensions() { return this._dimensions; }
  get featureVector() { return this._featureVector; }

  isUnlocked(unlockIds) {
    return unlockIds instanceof Set && unlockIds.has(this.unlockId);
  }

  resolve({ baseDimensions, baseFeatureVector }) {
    if (!baseDimensions || typeof baseDimensions.x !== 'number' || typeof baseDimensions.z !== 'number') {
      throw new Error('ItemVariant.resolve requires base dimensions.');
    }
    if (!(baseFeatureVector instanceof FeatureVector)) {
      throw new Error('ItemVariant.resolve requires baseFeatureVector.');
    }
    return Object.freeze({
      variantId: this.id,
      visual: this.visual,
      dimensions: Object.freeze({ ...(this.dimensions ?? baseDimensions) }),
      featureVector: this.featureVector ?? baseFeatureVector
    });
  }
}

export default ItemVariant;
