import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Infrastructure: ItemCatalog Implementation
 * Loads item definitions from JSON files with schema validation.
 */
class JsonItemCatalog {
  /**
   * @param {string} dataDir - Path to the data directory containing items/
   * @param {Object} schema - JSON Schema for item validation
   */
  constructor(dataDir, schema) {
    this.dataDir = dataDir;
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

    const items = [];
    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.dataDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Handle both array and single object formats
      const itemsArray = Array.isArray(data) ? data : [data];

      for (const item of itemsArray) {
        const valid = this.validate(item);
        if (!valid) {
          const errors = this.validate.errors.map(e => e.message).join(', ');
          throw new Error(`Item schema validation failed in ${file}: ${errors}`);
        }
        items.push(item);
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
