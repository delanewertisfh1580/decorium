/**
 * Port: LevelRepository
 * Contract for loading level data.
 * Implemented by Infrastructure layer.
 */

class LevelRepository {
  /**
   * @param {string} levelId
   * @returns {Promise<Object|null>} Raw level data or null if not found
   */
  async loadLevel(levelId) {
    throw new Error('Method "loadLevel" must be implemented by infrastructure.');
  }
}

export default LevelRepository;
