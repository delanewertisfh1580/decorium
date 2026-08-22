import Ajv from 'ajv';

function freezeReward(raw) {
  return Object.freeze({
    id: raw.id,
    levelId: raw.levelId,
    minimumStars: raw.minimumStars,
    grantUnlockIds: Object.freeze([...raw.grantUnlockIds])
  });
}

export class JsonProgressionRewardCatalog {
  constructor(catalogPath = './data/progression/rewards.v1.json', schema = null) {
    this.catalogPath = catalogPath;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.catalogPromise = null;
  }

  async listRewards() {
    const catalog = await this._loadCatalog();
    return Object.freeze(catalog.rewards.map(freezeReward));
  }

  async _loadCatalog() {
    if (!this.catalogPromise) this.catalogPromise = this._fetchCatalog();
    return this.catalogPromise;
  }

  async _fetchCatalog() {
    const response = await fetch(this.catalogPath);
    if (!response.ok) throw new Error(`Failed to load progression reward catalog: ${response.status}`);
    const catalog = await response.json();
    if (this.validate && !this.validate(catalog)) {
      const errors = this.validate.errors?.map(error => error.message).join(', ');
      throw new Error(`Progression reward schema validation failed: ${errors}`);
    }
    return catalog;
  }
}

export default JsonProgressionRewardCatalog;
