import Ajv from 'ajv';
import LevelRepository from '../../Application/Ports/LevelRepository.js';

export class JsonLevelRepository extends LevelRepository {
  constructor(basePath = './data/levels', schema = null) {
    super();
    this.basePath = basePath;
    this.validate = schema ? new Ajv().compile(schema) : null;
  }

  async loadLevel(levelId) {
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
}

export default JsonLevelRepository;
