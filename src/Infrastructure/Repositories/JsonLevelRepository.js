import Ajv from 'ajv';
import { LevelRepository } from '../../Application/Ports/LevelRepository.js';

/**
 * Infrastructure: LevelRepository Implementation
 * Loads level data from JSON files with schema validation.
 * Browser-compatible version using fetch API.
 */
export class JsonLevelRepository extends LevelRepository {
  /**
   * @param {string} basePath - Base path for JSON files (used in Node.js)
   * @param {Object} schema - JSON Schema for validation
   */
  constructor(basePath, schema) {
    super(null, schema);
    this.basePath = basePath;
    this.ajv = new Ajv();
    this.validate = this.ajv.compile(schema);
  }

  /**
   * @param {string} levelId
   * @returns {Promise<Object|null>} Raw level data or null if not found
   */
  async loadLevel(levelId) {
    // Browser: use fetch to load JSON
    const filePath = `${this.basePath}/${levelId}.json`;
    
    try {
      const response = await fetch(filePath);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to load level ${levelId}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate against schema
      const valid = this.validate(data);
      if (!valid) {
        const errors = this.validate.errors.map(e => e.message).join(', ');
        throw new Error(`Level schema validation failed for ${levelId}: ${errors}`);
      }
      
      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
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