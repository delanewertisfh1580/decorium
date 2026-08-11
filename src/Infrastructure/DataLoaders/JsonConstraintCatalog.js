import { LinearConstraint } from '../../Domain/Constraints/LinearConstraint.js';

export class JsonConstraintCatalog {
  constructor(path = './data/constraints/scandinavian-constraints.json') {
    this.path = path;
    this.cache = null;
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
