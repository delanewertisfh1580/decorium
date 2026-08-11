import Ajv from 'ajv';
import { CatalogValidator } from '../../Domain/Items/CatalogValidator.js';

export class JsonItemCatalog {
  constructor(basePath = './data/items', schema = null) {
    this.basePath = basePath;
    this.schema = schema;
    this.validator = new CatalogValidator();
    this.validateSchema = schema ? new Ajv().compile(schema) : null;
    this.itemsCache = null;
  }

  async loadAllItems() {
    if (this.itemsCache) return this.itemsCache;

    const response = await fetch(`${this.basePath}/catalog.v2.json`);
    if (!response.ok) throw new Error(`Failed to load V2 item catalog: ${response.status}`);
    const catalog = await response.json();

    if (this.validateSchema && !this.validateSchema(catalog)) {
      const errors = this.validateSchema.errors?.map(error => error.message).join(', ');
      throw new Error(`Item catalog schema validation failed: ${errors}`);
    }

    const rawItems = catalog.items ?? catalog;
    this.itemsCache = this.validator.createItems(rawItems);
    return this.itemsCache;
  }

  async getItemById(itemId) {
    return (await this.loadAllItems()).find(item => item.id === itemId) ?? null;
  }

  async getItemsByIds(itemIds) {
    const requested = new Set(itemIds);
    return (await this.loadAllItems()).filter(item => requested.has(item.id));
  }

  async getAllItems() {
    return this.loadAllItems();
  }

  clearCache() {
    this.itemsCache = null;
  }
}

export default JsonItemCatalog;
