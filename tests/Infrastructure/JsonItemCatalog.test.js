import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import JsonItemCatalog from '../../src/Infrastructure/DataLoaders/JsonItemCatalog.js';
import SchemaLoader from '../../src/Infrastructure/DataLoaders/SchemaLoader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('JsonItemCatalog', () => {
  let catalog;
  let schemaLoader;
  const itemsDir = path.join(__dirname, '../../data/items');
  const schemasDir = path.join(__dirname, '../../data/schemas');

  beforeEach(() => {
    schemaLoader = new SchemaLoader(schemasDir);
    const itemSchema = schemaLoader.loadSchema('item');
    catalog = new JsonItemCatalog(itemsDir, itemSchema);
    catalog.clearCache();
  });

  describe('loadAllItems', () => {
    it('should load all items', async () => {
      const items = await catalog.loadAllItems();
      
      assert.ok(Array.isArray(items));
      assert.ok(items.length > 0);
    });

    it('should cache loaded items', async () => {
      const items1 = await catalog.loadAllItems();
      const items2 = await catalog.loadAllItems();
      
      assert.strictEqual(items1, items2);
    });
  });

  describe('getItemById', () => {
    it('should return an item by ID', async () => {
      const item = await catalog.getItemById('scand-sofa-01');
      
      assert.ok(item !== null);
      assert.strictEqual(item.id, 'scand-sofa-01');
      assert.strictEqual(item.name, 'Диван Hygge');
      assert.strictEqual(item.category, 'sofa');
    });

    it('should return null for non-existent item', async () => {
      const item = await catalog.getItemById('non-existent-item');
      
      assert.strictEqual(item, null);
    });
  });

  describe('getItemsByIds', () => {
    it('should return multiple items by IDs', async () => {
      const items = await catalog.getItemsByIds(['scand-sofa-01', 'scand-chair-01']);
      
      assert.ok(Array.isArray(items));
      assert.strictEqual(items.length, 2);
      const ids = items.map(i => i.id);
      assert.ok(ids.includes('scand-sofa-01'));
      assert.ok(ids.includes('scand-chair-01'));
    });

    it('should return empty array for non-existent IDs', async () => {
      const items = await catalog.getItemsByIds(['non-existent-1', 'non-existent-2']);
      
      assert.ok(Array.isArray(items));
      assert.strictEqual(items.length, 0);
    });
  });
});
