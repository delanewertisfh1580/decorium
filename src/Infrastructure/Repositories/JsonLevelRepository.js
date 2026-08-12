import Ajv from 'ajv';
import LevelRepository from '../../Application/Ports/LevelRepository.js';

export class JsonLevelRepository extends LevelRepository {
  constructor(basePath = null, schema = null) {
    super();
    this.basePath = basePath;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.cachedLevels = {};
    
    // Если basePath === null, используем встроенные данные
    if (basePath === null && window.DECORIUM_DATA?.levels) {
      for (const [path, content] of Object.entries(window.DECORIUM_DATA.levels)) {
        const levelId = path.replace('.json', '');
        this.cachedLevels[levelId] = content;
      }
    }
  }

  async loadLevel(levelId) {
    // Сначала проверяем кэш встроенных данных
    if (this.cachedLevels[levelId]) {
      const data = this.cachedLevels[levelId];
      if (this.validate && !this.validate(data)) {
        const errors = this.validate.errors?.map(error => error.message).join(', ');
        throw new Error(`Level schema validation failed for ${levelId}: ${errors}`);
      }
      return data;
    }
    
    // Если нет в кэше и есть basePath, загружаем через fetch
    if (this.basePath) {
      const response = await fetch(`${this.basePath}/${levelId}.json`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Failed to load level ${levelId}: ${response.status}`);

      const data = await response.json();
      if (this.validate && !this.validate(data)) {
        const errors = this.validate.errors?.map(error => error.message).join(', ');
        throw new Error(`Level schema validation failed for ${levelId}: ${errors}`);
      }
      return data;
    }
    
    return null;
  }
}

export default JsonLevelRepository;
