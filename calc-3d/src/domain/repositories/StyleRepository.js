// =============================================================================
// domain/repositories/StyleRepository.js — репозиторий стилей.
// Базовые стили читает из данных styles.js; персональные (варьированные)
// регистрируются явно через register(). UI-список — только базовые стили.
// =============================================================================

import { STYLES, DEFAULT_STYLE_ID } from '../styles.js';
import { StyleDefinition } from '../value-objects/StyleDefinition.js';

export class StyleRepository {
    /** @param {object} [source] источник сырых базовых стилей */
    constructor(source = STYLES) {
        this._source = source;
        this._baseIds = Object.keys(source);
        this._overrides = new Map();
    }

    /**
     * Зарегистрировать персональный (варьированный) стиль.
     * @param {StyleDefinition} def
     * @returns {StyleDefinition}
     */
    register(def) {
        if (!(def instanceof StyleDefinition)) {
            throw new Error('StyleRepository.register: ожидается StyleDefinition');
        }
        this._overrides.set(def.id, def);
        return def;
    }

    /**
     * Стиль по id (персональный приоритетнее базового).
     * @param {string} id
     * @returns {StyleDefinition|null}
     */
    getById(id) {
        if (this._overrides.has(id)) return this._overrides.get(id);
        const raw = this._source[id];
        return raw ? new StyleDefinition(raw) : null;
    }

    /** Все базовые стили. @returns {StyleDefinition[]} */
    getAll() {
        return this._baseIds.map((id) => this.getById(id));
    }

    /** Id стиля по умолчанию. @returns {string} */
    getDefaultId() {
        return DEFAULT_STYLE_ID;
    }

    /** Список для UI-селектора: ТОЛЬКО базовые стили (персональные скрыты). */
    listForUI() {
        return this._baseIds.map((id) => {
            const { id: sid, name, icon, description } = this._source[id];
            return { id: sid, name, icon, description };
        });
    }
}