function requireVariantId(value) {
  if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(value)) {
    throw new Error('ItemConfiguration variantId must be a lowercase identifier.');
  }
  return value;
}

export class ItemConfiguration {
  static default(variantId) {
    return new ItemConfiguration({ variantId });
  }

  constructor({ variantId }) {
    this._variantId = requireVariantId(variantId);
    Object.freeze(this);
  }

  get variantId() { return this._variantId; }

  equals(other) {
    return other instanceof ItemConfiguration && other.variantId === this.variantId;
  }

  toJSON() {
    return Object.freeze({ variantId: this.variantId });
  }
}

export default ItemConfiguration;
