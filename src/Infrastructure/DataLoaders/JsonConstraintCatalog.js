import { LinearConstraint } from '../../Domain/Constraints/LinearConstraint.js';

export class JsonConstraintCatalog {
  constructor(path = null) {
    this.path = path;
    this.cache = null;
    
    // Если path === null, используем встроенные данные
    if (path === null && window.DECORIUM_DATA?.constraints) {
      this.cache = this._loadFromEmbedded();
    }
  }
  
  _loadFromEmbedded() {
    const allConstraints = [];
    for (const [path, content] of Object.entries(window.DECORIUM_DATA.constraints)) {
      if (Array.isArray(content)) {
        const constraints = content.map(item => new LinearConstraint(
          item.feature,
          item.operator === '>=' ? 'gte' : 'lte',
          item.threshold,
          item.id,
          item.weight,
          item.messageKey
        ));
        allConstraints.push(...constraints);
      }
    }
    return allConstraints;
  }
  
  setConstraints(constraintsData) {
    // Метод для прямой установки данных из EmbeddedDataLoader
    const allConstraints = [];
    for (const [path, content] of Object.entries(constraintsData)) {
      if (Array.isArray(content)) {
        const constraints = content.map(item => new LinearConstraint(
          item.feature,
          item.operator === '>=' ? 'gte' : 'lte',
          item.threshold,
          item.id,
          item.weight,
          item.messageKey
        ));
        allConstraints.push(...constraints);
      }
    }
    this.cache = allConstraints;
  }

  async loadAllConstraints() {
    if (this.cache) return this.cache;
    
    const response = await fetch(this.path);
    if (!response.ok) throw new Error(`Failed to load constraints: ${response.status}`);
    const data = await response.json();
    this.cache = data.map(item => new LinearConstraint(
      item.feature,
      item.operator === '>=' ? 'gte' : 'lte',
      item.threshold,
      item.id,
      item.weight,
      item.messageKey
    ));
    return this.cache;
  }

  async getConstraintsByStyleId(styleId) {
    const constraints = await this.loadAllConstraints();
    return constraints.filter(constraint => constraint.id?.startsWith(styleId.slice(0, 5)) || styleId === 'scandinavian');
  }
}

export default JsonConstraintCatalog;
