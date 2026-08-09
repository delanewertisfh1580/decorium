// =============================================================================
// domain/value-objects/StyleDefinition.js — Value Object стиля интерьера.
// =============================================================================

export class StyleDefinition {
    constructor(raw) {
      if (!raw || typeof raw.id !== 'string' || raw.id.length === 0) {
        throw new Error('StyleDefinition: id обязателен');
      }
      if (!Array.isArray(raw.constraints)) {
        throw new Error(`StyleDefinition[${raw.id}]: constraints должен быть массивом`);
      }
  
      this.id = raw.id;
      this.name = raw.name || raw.id;
      this.icon = raw.icon || '';
      this.description = raw.description || '';
      this.constraints = Object.freeze(
        raw.constraints.map((c) => Object.freeze({
          feature: c.feature,
          operator: c.operator,
          threshold: c.threshold,
          group: c.group,
          weight: c.weight ?? 1
        }))
      );
  
      Object.freeze(this);
    }
  
    withVariedThresholds(rng, { delta = 0.1, idSuffix = '__client' } = {}) {
      return new StyleDefinition({
        id: this.id + idSuffix,
        name: this.name,
        icon: this.icon,
        description: this.description,
        constraints: this.constraints.map((c) => {
          if (c.operator === '==') return { ...c };
          const varied = Math.min(1, Math.max(0, c.threshold + rng.range(-delta, delta)));
          return { ...c, threshold: varied };
        })
      });
    }
  }