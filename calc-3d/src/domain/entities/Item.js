// =============================================================================
// domain/entities/Item.js — Entity предмета интерьера.
// =============================================================================

import { Placement } from '../value-objects/Placement.js';
import { FeatureVector } from '../value-objects/FeatureVector.js';

export class Item {
  constructor({ id, type, placement, features, catalogId }) {
    if (typeof id !== 'number' && typeof id !== 'string') {
      throw new Error('Item: id должен быть числом или строкой');
    }
    if (typeof type !== 'string') throw new Error('Item: type должен быть строкой');
    if (!(placement instanceof Placement)) throw new Error('Item: placement должен быть Placement');
    if (!(features instanceof FeatureVector)) throw new Error('Item: features должен быть FeatureVector');

    this.id = id;
    this.type = type;
    this.placement = placement;
    this.features = features;
    this.catalogId = catalogId || type;
    
    Object.freeze(this);
  }

  withPlacement(newPlacement) {
    if (!(newPlacement instanceof Placement)) throw new Error('withPlacement: аргумент должен быть Placement');
    return new Item({
      id: this.id, type: this.type, placement: newPlacement,
      features: this.features, catalogId: this.catalogId
    });
  }

  withFeatures(newFeatures) {
    if (!(newFeatures instanceof FeatureVector)) throw new Error('withFeatures: аргумент должен быть FeatureVector');
    return new Item({
      id: this.id, type: this.type, placement: this.placement,
      features: newFeatures, catalogId: this.catalogId
    });
  }

  equals(other) {
    if (!(other instanceof Item)) return false;
    return this.id === other.id;
  }

  toJSON() {
    return {
      id: this.id, type: this.type,
      placement: this.placement.toJSON(),
      features: this.features.toJSON(),
      catalogId: this.catalogId
    };
  }
}