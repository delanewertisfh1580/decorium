import { FeatureVector } from './FeatureVector.js';

const MATERIAL_PROFILES = Object.freeze({
  wood: Object.freeze({ woodShare: 0.9, metalShare: 0.06, glassShare: 0.01, plasticShare: 0.03, textileShare: 0.03 }),
  'oak-light': Object.freeze({ woodShare: 0.9, metalShare: 0.05, glassShare: 0.01, plasticShare: 0.04, textileShare: 0.03 }),
  walnut: Object.freeze({ woodShare: 0.92, metalShare: 0.04, glassShare: 0.01, plasticShare: 0.03, textileShare: 0.02 }),
  textile: Object.freeze({ woodShare: 0.04, metalShare: 0.03, glassShare: 0, plasticShare: 0.04, textileShare: 0.94 }),
  velvet: Object.freeze({ woodShare: 0.03, metalShare: 0.03, glassShare: 0, plasticShare: 0.03, textileShare: 0.96 }),
  linen: Object.freeze({ woodShare: 0.05, metalShare: 0.02, glassShare: 0, plasticShare: 0.02, textileShare: 0.96 }),
  ceramic: Object.freeze({ woodShare: 0.03, metalShare: 0.04, glassShare: 0.72, plasticShare: 0.08, textileShare: 0.03 }),
  terracotta: Object.freeze({ woodShare: 0.02, metalShare: 0.02, glassShare: 0.76, plasticShare: 0.08, textileShare: 0.02 }),
  brass: Object.freeze({ woodShare: 0.02, metalShare: 0.9, glassShare: 0.01, plasticShare: 0.05, textileShare: 0.01 }),
  'black-metal': Object.freeze({ woodShare: 0.01, metalShare: 0.94, glassShare: 0.01, plasticShare: 0.04, textileShare: 0.01 }),
  graphite: Object.freeze({ woodShare: 0.03, metalShare: 0.42, glassShare: 0.12, plasticShare: 0.48, textileShare: 0 }),
  'midnight-metal': Object.freeze({ woodShare: 0.01, metalShare: 0.72, glassShare: 0.05, plasticShare: 0.32, textileShare: 0 })
});

function requireIdentifier(value, label) {
  if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`ItemVariant ${label} must be a lowercase identifier.`);
  }
  return value;
}

function clamp(value) { return Math.min(1, Math.max(0, value)); }

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

function colorFeatures(color) {
  const red = Number.parseInt(color.slice(1, 3), 16) / 255;
  const green = Number.parseInt(color.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(color.slice(5, 7), 16) / 255;
  const luminance = (red * 0.299) + (green * 0.587) + (blue * 0.114);
  const warmBias = clamp(((red + green) / 2) - blue + 0.5);
  const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
  return {
    lightColorShare: clamp(luminance),
    darkColorShare: clamp(1 - luminance),
    warmPaletteShare: warmBias,
    saturationLevel: clamp(saturation)
  };
}

function materialFeatures(materialId) {
  if (MATERIAL_PROFILES[materialId]) return MATERIAL_PROFILES[materialId];
  if (/wood|oak|walnut/.test(materialId)) return MATERIAL_PROFILES.wood;
  if (/textile|velvet|linen|fabric/.test(materialId)) return MATERIAL_PROFILES.textile;
  if (/metal|brass|steel|graphite/.test(materialId)) return MATERIAL_PROFILES['black-metal'];
  return null;
}

/**
 * Derive semantic score inputs from an authored visual variant when the content
 * has not supplied a full vector override. This keeps appearance choices honest:
 * changing walnut to textile or changing light to dark changes the style score.
 */
export function deriveVariantFeatureVector(baseFeatureVector, visual, baseDimensions, dimensions) {
  if (!(baseFeatureVector instanceof FeatureVector)) throw new Error('Variant feature derivation requires a base FeatureVector.');
  const features = baseFeatureVector.toArray();
  const material = materialFeatures(visual.materialId);
  if (material) {
    for (const field of ['woodShare', 'metalShare', 'glassShare', 'plasticShare', 'textileShare']) {
      features[field] = clamp((features[field] * 0.35) + (material[field] * 0.65));
    }
  }
  const color = colorFeatures(visual.color);
  for (const field of ['lightColorShare', 'darkColorShare', 'warmPaletteShare', 'saturationLevel']) {
    features[field] = clamp((features[field] * 0.35) + (color[field] * 0.65));
  }
  if (baseDimensions && dimensions) {
    const baseArea = baseDimensions.x * baseDimensions.z;
    const variantArea = dimensions.x * dimensions.z;
    if (baseArea > 0) features.sizeNorm = clamp(features.sizeNorm * (variantArea / baseArea));
  }
  return new FeatureVector(features);
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

  resolve({ baseDimensions, baseFeatureVector, deriveSemanticFeatureVector = false }) {
    if (!baseDimensions || typeof baseDimensions.x !== 'number' || typeof baseDimensions.z !== 'number') {
      throw new Error('ItemVariant.resolve requires base dimensions.');
    }
    if (!(baseFeatureVector instanceof FeatureVector)) {
      throw new Error('ItemVariant.resolve requires baseFeatureVector.');
    }
    const dimensions = Object.freeze({
      ...(this.dimensions ?? {
        x: baseDimensions.x * this.visual.scale,
        z: baseDimensions.z * this.visual.scale
      })
    });
    return Object.freeze({
      variantId: this.id,
      visual: this.visual,
      dimensions,
      featureVector: this.featureVector
        ?? (deriveSemanticFeatureVector
          ? deriveVariantFeatureVector(baseFeatureVector, this.visual, baseDimensions, dimensions)
          : baseFeatureVector)
    });
  }
}

export default ItemVariant;
