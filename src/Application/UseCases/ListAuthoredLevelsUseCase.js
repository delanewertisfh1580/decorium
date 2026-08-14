import LevelSummary from '../../Domain/Levels/LevelSummary.js';

export class ListAuthoredLevelsUseCase {
  constructor(levelRepository) {
    if (!levelRepository) {
      throw new Error('ListAuthoredLevelsUseCase: levelRepository is required.');
    }
    if (typeof levelRepository.listLevels !== 'function') {
      throw new Error('ListAuthoredLevelsUseCase: levelRepository must expose listLevels.');
    }
    this.levelRepository = levelRepository;
  }

  async execute() {
    try {
      const definitions = await this.levelRepository.listLevels();
      if (!Array.isArray(definitions)) {
        return { success: false, error: 'INVALID_LEVEL_CATALOG: Expected an array of level summaries.' };
      }

      const summaries = definitions.map(definition => new LevelSummary(definition));
      const ids = new Set();
      for (const summary of summaries) {
        if (ids.has(summary.id)) {
          return { success: false, error: `DUPLICATE_LEVEL_ID: ${summary.id}` };
        }
        ids.add(summary.id);
      }

      return {
        success: true,
        data: summaries.sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
      };
    } catch (error) {
      return { success: false, error: `INVALID_LEVEL_CATALOG: ${error.message}` };
    }
  }
}

export default ListAuthoredLevelsUseCase;
