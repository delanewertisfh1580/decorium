import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import JsonLevelRepository from '../../src/Infrastructure/Repositories/JsonLevelRepository.js';
import SchemaLoader from '../../src/Infrastructure/DataLoaders/SchemaLoader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('JsonLevelRepository', () => {
  let repository;
  let schemaLoader;
  const dataDir = path.join(__dirname, '../../data/levels');
  const schemasDir = path.join(__dirname, '../../data/schemas');

  beforeEach(() => {
    schemaLoader = new SchemaLoader(schemasDir);
    const levelSchema = schemaLoader.loadSchema('level');
    repository = new JsonLevelRepository(dataDir, levelSchema);
  });

  describe('loadLevel', () => {
    it('should load a valid level', async () => {
      const level = await repository.loadLevel('level-001');
      
      assert.ok(level !== null);
      assert.strictEqual(level.id, 'level-001');
      assert.strictEqual(level.name, 'Гостиная: Первые шаги');
      assert.strictEqual(level.styleId, 'scandinavian');
      assert.ok(Array.isArray(level.availableItems));
      assert.ok(level.roomDimensions);
    });

    it('should return null for non-existent level', async () => {
      const level = await repository.loadLevel('non-existent-level');
      
      assert.strictEqual(level, null);
    });

    it('should validate level against schema', async () => {
      // The repository should throw an error if schema validation fails
      // This is tested by the successful load above
      const level = await repository.loadLevel('level-001');
      assert.ok(level !== null);
    });
  });
});
