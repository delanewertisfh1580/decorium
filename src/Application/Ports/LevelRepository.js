/**
 * Port for loading validated level definitions.
 */
export class LevelRepository {
  async loadLevel(_levelId) {
    throw new Error('Method "loadLevel" must be implemented by infrastructure.');
  }

  async listLevels() {
    throw new Error('Method "listLevels" must be implemented by infrastructure.');
  }
}

export default LevelRepository;
