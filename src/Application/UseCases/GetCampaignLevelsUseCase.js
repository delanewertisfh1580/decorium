import LevelSummary from '../../Domain/Levels/LevelSummary.js';
import ProgressionPolicy from '../../Domain/Progression/ProgressionPolicy.js';

export class GetCampaignLevelsUseCase {
  constructor(levelRepository, progressionPolicy = new ProgressionPolicy()) {
    if (!levelRepository || typeof levelRepository.listLevels !== 'function') {
      throw new Error('GetCampaignLevelsUseCase: levelRepository with listLevels is required.');
    }
    if (!(progressionPolicy instanceof ProgressionPolicy)) {
      throw new Error('GetCampaignLevelsUseCase: progressionPolicy must be a ProgressionPolicy.');
    }
    this.levelRepository = levelRepository;
    this.progressionPolicy = progressionPolicy;
  }

  async execute(profile) {
    try {
      const rawLevels = await this.levelRepository.listLevels();
      if (!Array.isArray(rawLevels)) {
        return { success: false, error: 'INVALID_LEVEL_CATALOG: Expected an array of authored levels.' };
      }
      const levels = rawLevels.map(level => new LevelSummary(level));
      const ids = new Set();
      for (const level of levels) {
        if (ids.has(level.id)) {
          return { success: false, error: `INVALID_LEVEL_CATALOG: Duplicate level ID ${level.id}.` };
        }
        ids.add(level.id);
      }
      const ordered = [...levels].sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
      const availability = this.progressionPolicy.evaluate(ordered, profile);
      const availabilityById = new Map(availability.map(entry => [entry.levelId, entry]));

      return {
        success: true,
        data: ordered.map(level => {
          const { levelId: _levelId, ...availabilityEntry } = availabilityById.get(level.id);
          return { ...level.toJSON(), ...availabilityEntry };
        })
      };
    } catch (error) {
      return { success: false, error: `UNEXPECTED_ERROR: ${error.message}` };
    }
  }
}

export default GetCampaignLevelsUseCase;
