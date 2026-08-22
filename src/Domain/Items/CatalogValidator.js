import { FeatureVector } from './FeatureVector.js';
import { Item } from './Item.js';
import InteractionProfile from './InteractionProfile.js';
import SpatialBehavior from './SpatialBehavior.js';
import ItemVariant from './ItemVariant.js';

export class CatalogValidator {
  validate(items) {
    if (!Array.isArray(items) || items.length === 0) throw new Error('Catalog must be a non-empty array');
    const seenIds = new Set();
    for (const item of items) {
      if (!item?.id || typeof item.id !== 'string') throw new Error('Item has invalid or missing id');
      if (seenIds.has(item.id)) throw new Error(`Duplicate item id: ${item.id}`);
      seenIds.add(item.id);
      if (!item.name || !item.type) throw new Error(`Item ${item.id}: name and type are required`);
      if (!item.dimensions || typeof item.dimensions.x !== 'number' || typeof item.dimensions.z !== 'number') {
        throw new Error(`Item ${item.id}: invalid or missing dimensions`);
      }
      if (typeof item.price !== 'number' || item.price < 0) throw new Error(`Item ${item.id}: price must be non-negative`);
      if (!item.featureVector) throw new Error(`Item ${item.id}: missing featureVector`);
      new FeatureVector(item.featureVector);
      if (item.interactionProfile === undefined) throw new Error(`Item ${item.id}: missing interactionProfile`);
      new InteractionProfile(item.interactionProfile);
      if (item.spatialBehavior === undefined) throw new Error(`Item ${item.id}: missing spatialBehavior`);
      new SpatialBehavior(item.spatialBehavior);
      if (item.variants !== undefined) {
        if (!Array.isArray(item.variants) || item.variants.length === 0 || typeof item.baseVariantId !== 'string') {
          throw new Error(`Item ${item.id}: variants and baseVariantId are required together`);
        }
        const ids = new Set();
        for (const variant of item.variants) {
          const hydrated = new ItemVariant({ ...variant, featureVector: variant.featureVector ? new FeatureVector(variant.featureVector) : null });
          if (ids.has(hydrated.id)) throw new Error(`Item ${item.id}: duplicate variant ${hydrated.id}`);
          ids.add(hydrated.id);
        }
        if (!ids.has(item.baseVariantId)) throw new Error(`Item ${item.id}: unknown baseVariantId ${item.baseVariantId}`);
      }
    }
  }

  createItems(itemsData) {
    this.validate(itemsData);
    return itemsData.map(data => new Item({
      id: data.id,
      name: data.name,
      type: data.type,
      dimensions: data.dimensions,
      price: data.price,
      featureVector: new FeatureVector(data.featureVector),
      baseVariantId: data.baseVariantId ?? null,
      variants: (data.variants ?? []).map(variant => new ItemVariant({
        ...variant,
        featureVector: variant.featureVector ? new FeatureVector(variant.featureVector) : null
      })),
      interactionProfile: new InteractionProfile(data.interactionProfile),
      spatialBehavior: new SpatialBehavior(data.spatialBehavior)
    }));
  }
}
