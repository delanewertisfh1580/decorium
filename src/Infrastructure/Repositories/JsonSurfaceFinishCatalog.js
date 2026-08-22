import Ajv from 'ajv';

function freezeFinish(raw) {
  return Object.freeze({
    id: raw.id,
    label: raw.label,
    surface: raw.surface,
    unlockId: raw.unlockId,
    visual: Object.freeze({ ...raw.visual })
  });
}

export class JsonSurfaceFinishCatalog {
  constructor(catalogPath = './data/interior/surface-finishes.v1.json', schema = null) {
    this.catalogPath = catalogPath;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.catalogPromise = null;
  }

  async listFinishes() {
    const catalog = await this._loadCatalog();
    return Object.freeze(catalog.finishes.map(freezeFinish));
  }

  async getById(finishId) {
    const finishes = await this.listFinishes();
    return finishes.find(finish => finish.id === finishId) ?? null;
  }

  async _loadCatalog() {
    if (!this.catalogPromise) this.catalogPromise = this._fetchCatalog();
    return this.catalogPromise;
  }

  async _fetchCatalog() {
    const response = await fetch(this.catalogPath);
    if (!response.ok) throw new Error(`Failed to load surface finish catalog: ${response.status}`);
    const catalog = await response.json();
    if (this.validate && !this.validate(catalog)) {
      const errors = this.validate.errors?.map(error => error.message).join(', ');
      throw new Error(`Surface finish schema validation failed: ${errors}`);
    }
    return catalog;
  }
}

export default JsonSurfaceFinishCatalog;
