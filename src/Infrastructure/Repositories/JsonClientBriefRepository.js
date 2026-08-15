import Ajv from 'ajv';

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freezeDeep(nested);
  return Object.freeze(value);
}

export class JsonClientBriefRepository {
  constructor(catalogPath = './data/briefs/client-briefs.v1.json', schema = null) {
    this.catalogPath = catalogPath;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.catalogPromise = null;
  }

  async getById(briefId) {
    if (!briefId || typeof briefId !== 'string') return null;
    const catalog = await this._loadCatalog();
    const brief = catalog.briefs.find(candidate => candidate.id === briefId) ?? null;
    return brief ? freezeDeep(structuredClone(brief)) : null;
  }

  async _loadCatalog() {
    if (!this.catalogPromise) this.catalogPromise = this._fetchCatalog();
    return this.catalogPromise;
  }

  async _fetchCatalog() {
    const response = await fetch(this.catalogPath);
    if (!response.ok) throw new Error(`Failed to load client brief catalog: ${response.status}`);

    const catalog = await response.json();
    if (this.validate && !this.validate(catalog)) {
      const errors = this.validate.errors?.map(error => error.message).join(', ');
      throw new Error(`ClientBrief schema validation failed: ${errors}`);
    }
    return catalog;
  }
}

export default JsonClientBriefRepository;
