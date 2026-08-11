import Ajv from 'ajv';

export default class JsonScoringParametersLoader {
  constructor(path = './data/scoring/scoring-parameters.json', schema = null) {
    this.path = path;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.cache = null;
  }

  async loadParameters() {
    if (this.cache) return this.cache;
    const response = await fetch(this.path);
    if (!response.ok) throw new Error(`Failed to load scoring parameters: ${response.status}`);
    const data = await response.json();
    if (this.validate && !this.validate(data)) throw new Error('Scoring parameters schema validation failed');
    this.cache = data;
    return data;
  }

  clearCache() { this.cache = null; }
}
