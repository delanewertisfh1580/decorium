import Ajv from 'ajv';

/**
 * Infrastructure: ItemCatalog Implementation
 * Loads item definitions from JSON files with schema validation.
 * Browser-compatible version using fetch API.
 */
export class JsonItemCatalog {
  /**
   * @param {string} basePath - Base path for JSON files
   * @param {Object} schema - JSON Schema for item validation
   */
  constructor(basePath, schema) {
    this.basePath = basePath;
    this.schema = schema;
    this.ajv = new Ajv();
    this.validate = this.ajv.compile(schema);
    this.itemsCache = null;
  }

  /**
   * Load all items from the catalog
   * @returns {Promise<Array<Object>>} Array of item definitions
   */
  async loadAllItems() {
    if (this.itemsCache) {
      return this.itemsCache;
    }

    // Browser: fetch list of items from index.json or predefined list
    const response = await fetch(`${this.basePath}/items/index.json`);
    
    if (!response.ok) {
      throw new Error('Failed to load items index');
    }
    
    const indexData = await response.json();
    const itemIds = Array.isArray(indexData) ? indexData : indexData.items || [];
    
    const items = [];
    for (const itemId of itemIds) {
      const itemResponse = await fetch(`${this.basePath}/items/${itemId}.json`);
      if (itemResponse.ok) {
        const data = await itemResponse.json();
        const itemsArray = Array.isArray(data) ? data : [data];
        
        for (const item of itemsArray) {
          const valid = this.validate(item);
          if (!valid) {
            const errors = this.validate.errors.map(e => e.message).join(', ');
            throw new Error(`Item schema validation failed for ${itemId}: ${errors}`);
          }
          items.push(item);
        }
      }
    }

    this.itemsCache = items;
    return items;
  }

  /**
   * Get a specific item by ID
   * @param {string} itemId
   * @returns {Promise<Object|null>} Item definition or null if not found
   */
  async getItemById(itemId) {
    const items = await this.loadAllItems();
    return items.find(item => item.id === itemId) || null;
  }

  /**
   * Get multiple items by IDs
   * @param {Array<string>} itemIds
   * @returns {Promise<Array<Object>>} Array of item definitions
   */
  async getItemsByIds(itemIds) {
    const items = await this.loadAllItems();
    return items.filter(item => itemIds.includes(item.id));
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache() {
    this.itemsCache = null;
  }
}

export default JsonItemCatalog;
