import Ajv from 'ajv';
import PresentationEnvironmentRepository from '../../Application/Ports/PresentationEnvironmentRepository.js';

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freezeDeep(nested);
  return Object.freeze(value);
}

export class JsonPresentationEnvironmentRepository extends PresentationEnvironmentRepository {
  constructor(catalogPath = './data/presentation/environment-profiles.v2.json', schema = null) {
    super();
    this.catalogPath = catalogPath;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.catalogPromise = null;
  }

  async getById(profileId) {
    if (!profileId || typeof profileId !== 'string') return null;
    const catalog = await this._loadCatalog();
    const profile = catalog.profiles.find(candidate => candidate.id === profileId) ?? null;
    return profile ? freezeDeep(structuredClone(profile)) : null;
  }

  async _loadCatalog() {
    if (!this.catalogPromise) this.catalogPromise = this._fetchCatalog();
    return this.catalogPromise;
  }

  async _fetchCatalog() {
    const response = await fetch(this.catalogPath);
    if (!response.ok) throw new Error(`Failed to load presentation environment catalog: ${response.status}`);

    const catalog = await response.json();
    if (this.validate && !this.validate(catalog)) {
      const errors = this.validate.errors?.map(error => error.message).join(', ');
      throw new Error(`Presentation environment schema validation failed: ${errors}`);
    }
    return catalog;
  }
}

export default JsonPresentationEnvironmentRepository;
