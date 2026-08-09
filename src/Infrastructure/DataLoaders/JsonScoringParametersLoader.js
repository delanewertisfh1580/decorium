import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Infrastructure: ScoringParametersLoader
 * Loads scoring configuration from JSON files.
 */
class JsonScoringParametersLoader {
  /**
   * @param {string} dataDir - Path to the scoring directory
   * @param {Object} schema - JSON Schema for validation
   */
  constructor(dataDir, schema) {
    this.dataDir = dataDir;
    this.schema = schema;
    this.ajv = new Ajv();
    this.validate = this.ajv.compile(schema);
    this.parametersCache = null;
  }

  /**
   * Load scoring parameters
   * @returns {Promise<Object>} Scoring parameters object
   */
  async loadParameters() {
    if (this.parametersCache) {
      return this.parametersCache;
    }

    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      throw new Error(`No scoring parameter files found in ${this.dataDir}`);
    }

    // Load the first JSON file (typically scoring-parameters.json)
    const filePath = path.join(this.dataDir, files[0]);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Validate against schema
    const valid = this.validate(data);
    if (!valid) {
      const errors = this.validate.errors.map(e => e.message).join(', ');
      throw new Error(`Scoring parameters schema validation failed: ${errors}`);
    }

    this.parametersCache = data;
    return data;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.parametersCache = null;
  }
}

export default JsonScoringParametersLoader;
