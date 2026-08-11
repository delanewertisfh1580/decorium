/**
 * Port: LevelRepository
 * Contract for loading level data.
 * Implemented by Infrastructure layer.
 */
export class LevelRepository {
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
   * @param {string} levelId
   * @returns {Promise<Object|null>} Raw level data or null if not found
   */
  async loadLevel(levelId) {
    throw new Error('Method "loadLevel" must be implemented by infrastructure.');
  }
}

export default LevelRepository;
