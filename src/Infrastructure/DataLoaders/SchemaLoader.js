import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Infrastructure: SchemaLoader
 * Loads JSON Schema definitions for validation.
 */
class SchemaLoader {
  /**
   * @param {string} schemasDir - Path to the schemas directory
   */
  constructor(schemasDir) {
    this.schemasDir = schemasDir;
    this.schemasCache = {};
  }

  /**
   * Load a specific schema by name
   * @param {string} schemaName - Name of the schema file (without .json)
   * @returns {Object} The schema object
   */
  loadSchema(schemaName) {
    if (this.schemasCache[schemaName]) {
      return this.schemasCache[schemaName];
    }

    const filePath = path.join(this.schemasDir, `${schemaName}.schema.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Schema file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const schema = JSON.parse(fileContent);

    this.schemasCache[schemaName] = schema;
    return schema;
  }

  /**
   * Load all schemas from the directory
   * @returns {Object} Object with schema names as keys
   */
  loadAllSchemas() {
    const schemas = {};
    const files = fs.readdirSync(this.schemasDir).filter(f => f.endsWith('.schema.json'));

    for (const file of files) {
      const schemaName = file.replace('.schema.json', '');
      schemas[schemaName] = this.loadSchema(schemaName);
    }

    return schemas;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.schemasCache = {};
  }
}

export default SchemaLoader;
