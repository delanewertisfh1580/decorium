import { FeatureVector } from '../Items/FeatureVector.js';

function requirePositiveFinite(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`StyleInfluenceProfile: ${label} must be a positive finite number`);
  }
  return value;
}

function normalizePolicy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1) {
    throw new Error('StyleInfluenceProfile: styleInfluence schemaVersion must be 1');
  }
  if (value.mode !== 'capped-square-root-footprint') {
    throw new Error('StyleInfluenceProfile: styleInfluence mode is not supported');
  }
  const referenceAreaM2 = requirePositiveFinite(value.referenceAreaM2, 'styleInfluence.referenceAreaM2');
  const minimumWeight = requirePositiveFinite(value.minimumWeight, 'styleInfluence.minimumWeight');
  const maximumWeight = requirePositiveFinite(value.maximumWeight, 'styleInfluence.maximumWeight');
  if (maximumWeight < minimumWeight) {
    throw new Error('StyleInfluenceProfile: styleInfluence.maximumWeight must be greater than or equal to minimumWeight');
  }
  return Object.freeze({
    schemaVersion: 1,
    mode: value.mode,
    referenceAreaM2,
    minimumWeight,
    maximumWeight
  });
}

function requireCanonicalInstanceId(item) {
  if (!item || typeof item.id !== 'string' || typeof item.itemId !== 'string') {
    throw new Error('StyleInfluenceProfile: placed item must provide a canonical instance id');
  }
  const prefix = `${item.itemId}#`;
  const ordinal = item.id.startsWith(prefix) ? item.id.slice(prefix.length) : '';
  if (!/^[1-9]\d*$/.test(ordinal)) {
    throw new Error('StyleInfluenceProfile: placed item must provide a canonical instance id');
  }
  return item.id;
}

function footprintAreaM2(item) {
  const dimensions = item?.dimensions;
  if (!dimensions || !Number.isFinite(dimensions.x) || !Number.isFinite(dimensions.z)
    || dimensions.x <= 0 || dimensions.z <= 0) {
    throw new Error('StyleInfluenceProfile: placed item must provide positive finite dimensions');
  }
  return dimensions.x * dimensions.z;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Immutable style aggregation facts for a concrete room state.
 * Every placed visual item participates; occupancy and clearance filters are intentionally absent.
 */
export class StyleInfluenceProfile {
  constructor({ policy, contributions, totalWeight, roomVector }) {
    this._policy = policy;
    this._contributions = contributions;
    this._totalWeight = totalWeight;
    this._roomVector = roomVector;
    Object.freeze(this);
  }

  get policy() { return this._policy; }
  get contributions() { return this._contributions; }
  get totalWeight() { return this._totalWeight; }
  get roomVector() { return this._roomVector; }

  static fromPlacedItems({ placedItems, styleInfluence }) {
    if (!Array.isArray(placedItems) || placedItems.length === 0) {
      throw new Error('StyleInfluenceProfile: placedItems must be a non-empty array');
    }
    const policy = normalizePolicy(styleInfluence);
    const drafts = placedItems.map(item => {
      const instanceId = requireCanonicalInstanceId(item);
      const area = footprintAreaM2(item);
      if (!(item.featureVector instanceof FeatureVector)) {
        throw new Error(`StyleInfluenceProfile: ${instanceId} featureVector must be a FeatureVector`);
      }
      const rawWeight = Math.sqrt(area / policy.referenceAreaM2);
      const influenceWeight = clamp(rawWeight, policy.minimumWeight, policy.maximumWeight);
      return { instanceId, catalogItemId: item.itemId, footprintAreaM2: area, influenceWeight, featureVector: item.featureVector };
    });
    const totalWeight = drafts.reduce((total, contribution) => total + contribution.influenceWeight, 0);
    const contributions = Object.freeze(drafts.map(contribution => Object.freeze({
      instanceId: contribution.instanceId,
      catalogItemId: contribution.catalogItemId,
      footprintAreaM2: contribution.footprintAreaM2,
      influenceWeight: contribution.influenceWeight,
      influenceShare: contribution.influenceWeight / totalWeight
    })));
    const roomVector = FeatureVector.weightedAverage(
      drafts.map(contribution => contribution.featureVector),
      drafts.map(contribution => contribution.influenceWeight)
    );

    return new StyleInfluenceProfile({ policy, contributions, totalWeight, roomVector });
  }
}

export default StyleInfluenceProfile;
