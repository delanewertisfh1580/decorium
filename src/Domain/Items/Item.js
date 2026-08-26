import { FeatureVector } from './FeatureVector.js';
import InteractionProfile from './InteractionProfile.js';
import SpatialBehavior from './SpatialBehavior.js';
import ItemVariant from './ItemVariant.js';

export class Item {
  constructor({
    id,
    name,
    type,
    featureVector,
    dimensions,
    price = 0,
    baseVariantId = null,
    variants = [],
    interactionProfile,
    spatialBehavior
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
    if (!Array.isArray(variants) || !variants.every(variant => variant instanceof ItemVariant)) {
      throw new Error('Item variants must be an array of ItemVariant instances.');
    }
    const variantsById = new Map(variants.map(variant => [variant.id, variant]));
    if (variantsById.size !== variants.length) throw new Error('Item variants must have unique ids.');
    if (baseVariantId !== null && !variantsById.has(baseVariantId)) {
      throw new Error('Item baseVariantId must reference one of its variants.');
    }

    this._id = id.trim();
    this._name = name;
    this._type = type;
    this._featureVector = featureVector;
    this._dimensions = dimensions;
    this._price = price;
    this._baseVariantId = baseVariantId;
    this._variantsById = variantsById;
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
  get baseVariantId() { return this._baseVariantId; }
  get variants() { return Object.freeze([...this._variantsById.values()]); }
  get interactionProfile() { return this._interactionProfile; }
  get spatialBehavior() { return this._spatialBehavior; }

  getVariant(variantId) {
    return this._variantsById.get(variantId) ?? null;
  }

  resolveConfiguration(configuration = null) {
    const variantId = configuration?.variantId ?? this.baseVariantId;
    if (variantId === null) {
      return Object.freeze({
        variantId: null,
        visual: null,
        dimensions: Object.freeze({ ...(this.dimensions ?? { x: 1, z: 1 }) }),
        featureVector: this.featureVector
      });
    }
    const variant = this.getVariant(variantId);
    if (!variant) throw new Error(`Item ${this.id} has no variant ${variantId}.`);
    return variant.resolve({
      baseDimensions: this.dimensions,
      baseFeatureVector: this.featureVector,
      // The base variant preserves the authored catalog vector. Other variants
      // derive semantic score inputs from their material, color and dimensions
      // unless the author supplied an explicit featureVector override.
      deriveSemanticFeatureVector: variant.id !== this.baseVariantId
    });
  }
}

export default Item;
