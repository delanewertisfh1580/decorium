import { FeatureVector } from './FeatureVector.js';
import { Item } from './Item.js';

/**
 * Validates a catalog of items for completeness and consistency.
 * Ensures all items have valid IDs, feature vectors with all required fields,
 * and proper normalization (0..1).
 */
export class CatalogValidator {
  /**
   * Validate an array of items
   * @param {Array} items - Array of item data objects
   * @throws {Error} If validation fails
   */
  validate(items) {
    if (!Array.isArray(items)) {
      throw new Error('Catalog must be an array');
    }

    if (items.length === 0) {
      throw new Error('Catalog cannot be empty');
    }

    const seenIds = new Set();

    for (const itemData of items) {
      // Check for duplicate IDs
      if (seenIds.has(itemData.id)) {
        throw new Error(`Duplicate item id: ${itemData.id}`);
      }
      seenIds.add(itemData.id);

      // Validate required fields
      if (!itemData.id || typeof itemData.id !== 'string') {
        throw new Error(`Item ${itemData.id}: invalid or missing id`);
      }
      if (!itemData.name || typeof itemData.name !== 'string') {
        throw new Error(`Item ${itemData.id}: invalid or missing name`);
      }
      if (!itemData.type || typeof itemData.type !== 'string') {
        throw new Error(`Item ${itemData.id}: invalid or missing type`);
      }
      if (!itemData.dimensions || typeof itemData.dimensions !== 'object') {
        throw new Error(`Item ${itemData.id}: invalid or missing dimensions`);
      }
      if (typeof itemData.dimensions.x !== 'number' || typeof itemData.dimensions.z !== 'number') {
        throw new Error(`Item ${itemData.id}: dimensions must have x and z numbers`);
      }
      if (typeof itemData.price !== 'number' || itemData.price < 0) {
        throw new Error(`Item ${itemData.id}: price must be a non-negative number`);
      }

      // Validate feature vector
      if (!itemData.featureVector || typeof itemData.featureVector !== 'object') {
        throw new Error(`Item ${itemData.id}: missing or invalid featureVector`);
      }

      // Check all required fields are present
      for (const field of FeatureVector.REQUIRED_FIELDS) {
        if (!(field in itemData.featureVector)) {
          throw new Error(`Item ${itemData.id}: missing required field ${field}`);
        }
        const value = itemData.featureVector[field];
        if (typeof value !== 'number') {
          throw new Error(`Item ${itemData.id}: ${field} must be a number`);
        }
        if (value < 0 || value > 1) {
          throw new Error(`Item ${itemData.id}: ${field} must be between 0 and 1`);
        }
      }
    }
  }

  /**
   * Create validated Item instances from raw data
   * @param {Array} itemsData - Array of raw item data
   * @returns {Item[]} Array of validated Item instances
   */
  createItems(itemsData) {
    this.validate(itemsData);
    return itemsData.map(data => new Item({
      id: data.id,
      name: data.name,
      type: data.type,
      dimensions: data.dimensions,
      price: data.price,
      featureVector: new FeatureVector(data.featureVector)
    }));
  }
}
