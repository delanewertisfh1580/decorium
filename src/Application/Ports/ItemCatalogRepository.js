/**
 * Port: ItemCatalogRepository
 * Contract for loading item catalog data.
 * Implemented by Infrastructure layer.
 */
export class ItemCatalogRepository {
  /**
   * @param {Object} dataLoader - Data loader adapter
   * @param {Object} schema - JSON Schema for validation
   */
  constructor(dataLoader, schema) {
    if (!dataLoader || typeof dataLoader.load !== 'function') {
      throw new Error('INVALID_CONSTRUCTOR_ARGS: dataLoader must be provided with a load method');
    }
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      throw new Error('INVALID_CONSTRUCTOR_ARGS: schema must be an object');
    }
    this.dataLoader = dataLoader;
    this.schema = schema;
  }

  /**
   * Load all items from the catalog
   * @returns {Promise<Array<Object>>} Array of item definitions
   */
  async loadAllItems() {
    throw new Error('Method "loadAllItems" must be implemented by infrastructure.');
  }

  /**
   * Get a specific item by ID
   * @param {string} itemId
   * @returns {Promise<Object|null>} Item definition or null if not found
   */
  async getItemById(itemId) {
    throw new Error('Method "getItemById" must be implemented by infrastructure.');
  }

  /**
   * Get multiple items by IDs
   * @param {Array<string>} itemIds
   * @returns {Promise<Array<Object>>} Array of item definitions
   */
  async getItemsByIds(itemIds) {
    throw new Error('Method "getItemsByIds" must be implemented by infrastructure.');
  }
}

export default ItemCatalogRepository;
