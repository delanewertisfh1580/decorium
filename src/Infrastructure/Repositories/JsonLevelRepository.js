import Ajv from 'ajv';
import LevelRepository from '../../Application/Ports/LevelRepository.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Infrastructure: LevelRepository Implementation
 * Loads level data from JSON files with schema validation.
 */
class JsonLevelRepository extends LevelRepository {
  /**
   * @param {string} dataDir - Path to the data directory
   * @param {Object} schema - JSON Schema for validation
   */
  constructor(dataDir, schema) {
    super();
    this.dataDir = dataDir;
    this.schema = schema;
    this.ajv = new Ajv();
    this.validate = this.ajv.compile(schema);
  }

  /**
   * @param {string} levelId
   * @returns {Promise<Object|null>} Raw level data or null if not found
   */
  async loadLevel(levelId) {
    const filePath = path.join(this.dataDir, `${levelId}.json`);

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return null;
      }

      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Validate against schema
      const valid = this.validate(data);
      if (!valid) {
        const errors = this.validate.errors.map(e => e.message).join(', ');
        throw new Error(`Level schema validation failed for ${levelId}: ${errors}`);
      }

      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in level file ${levelId}: ${error.message}`);
      }
      throw error;
    }
  }
}

export default JsonLevelRepository;
