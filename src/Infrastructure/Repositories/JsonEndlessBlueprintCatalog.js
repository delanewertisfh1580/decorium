import Ajv from 'ajv';

function freezeBlueprint(blueprint) {
  return Object.freeze(structuredClone(blueprint));
}

export class JsonEndlessBlueprintCatalog {
  constructor(path = './data/endless/endless-blueprints.v1.json', schema = null) {
    this.path = path;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.cache = null;
  }

  async listBlueprints() {
    if (this.cache) return this.cache;
    const response = await fetch(this.path);
    if (!response.ok) throw new Error(`Failed to load endless blueprints: ${response.status}`);
    const catalog = await response.json();
    if (this.validate && !this.validate(catalog)) {
      const errors = this.validate.errors?.map(error => error.message).join(', ');
      throw new Error(`Endless blueprint schema validation failed: ${errors}`);
    }
    if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.blueprints) || catalog.blueprints.length === 0) {
      throw new Error('Endless blueprint catalog must contain schemaVersion 1 and at least one blueprint.');
    }
    const ids = catalog.blueprints.map(blueprint => blueprint?.id);
    if (new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || id === '')) {
      throw new Error('Endless blueprint catalog must contain unique non-empty blueprint ids.');
    }
    this.cache = Object.freeze(catalog.blueprints.map(freezeBlueprint));
    return this.cache;
  }
}

export default JsonEndlessBlueprintCatalog;
