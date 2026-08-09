// =============================================================================
// domain/repositories/StyleRepository.js — репозиторий стилей.
// =============================================================================

import { STYLES, DEFAULT_STYLE_ID } from '../styles.js';
import { StyleDefinition } from '../value-objects/StyleDefinition.js';

export class StyleRepository {
  constructor(source = STYLES) {
    this._source = source;
    this._baseIds = Object.keys(source);
    this._overrides = new Map();
  }

  register(def) {
    if (!(def instanceof StyleDefinition)) {
      throw new Error('StyleRepository.register: ожидается StyleDefinition');
    }
    this._overrides.set(def.id, def);
    return def;
  }

  getById(id) {
    if (this._overrides.has(id)) return this._overrides.get(id);
    const raw = this._source[id];
    return raw ? new StyleDefinition(raw) : null;
  }

  getAll() {
    return this._baseIds.map((id) => this.getById(id));
  }

  getDefaultId() {
    return DEFAULT_STYLE_ID;
  }

  listForUI() {
    return this._baseIds.map((id) => {
      const { id: sid, name, icon, description } = this._source[id];
      return { id: sid, name, icon, description };
    });
  }
}