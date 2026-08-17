import Ajv from 'ajv';
import { LinearConstraint } from '../../Domain/Constraints/LinearConstraint.js';

function toLinearConstraint(data) {
  return new LinearConstraint(
    data.feature,
    data.operator === '>=' || data.operator === 'gte' ? 'gte' : 'lte',
    data.threshold,
    data.id,
    data.weight,
    data.messageKey
  );
}

function freezeProfiles(data) {
  if (Array.isArray(data)) {
    return Object.freeze([Object.freeze({
      id: 'scandinavian',
      label: 'Scandinavian',
      constraints: Object.freeze(data.map(toLinearConstraint))
    })]);
  }
  return Object.freeze(data.profiles.map(profile => Object.freeze({
    id: profile.id,
    label: profile.label,
    constraints: Object.freeze(profile.constraints.map(toLinearConstraint))
  })));
}

export class JsonConstraintCatalog {
  constructor(path = './data/styles/style-constraint-catalog.v1.json', schema = null) {
    this.path = path;
    this.validate = schema ? new Ajv().compile(schema) : null;
    this.cache = null;
  }

  async loadAllConstraints() {
    if (this.cache) return this.cache.flatMap(profile => profile.constraints);
    const response = await fetch(this.path);
    if (!response.ok) throw new Error(`Failed to load constraints: ${response.status}`);
    const data = await response.json();
    if (this.validate && !this.validate(data)) {
      const errors = this.validate.errors?.map(error => error.message).join(', ');
      throw new Error(`Style constraint catalog schema validation failed: ${errors}`);
    }
    this.cache = freezeProfiles(data);
    return this.cache.flatMap(profile => profile.constraints);
  }

  async getStyleProfileById(styleId) {
    if (!styleId || typeof styleId !== 'string') return null;
    await this.loadAllConstraints();
    return this.cache.find(profile => profile.id === styleId) ?? null;
  }

  async getConstraintsByStyleId(styleId) {
    return (await this.getStyleProfileById(styleId))?.constraints ?? [];
  }
}

export default JsonConstraintCatalog;
