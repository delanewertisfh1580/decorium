// =============================================================================
// domain/value-objects/StyleDefinition.js — Value Object стиля интерьера.
// Иммутабельный. Вариация порогов (GDD: b_i += rand[-0.1, +0.1]) — метод VO,
// возвращающий НОВЫЙ экземпляр; мутации данных отсутствуют.
// =============================================================================

/**
 * Value Object: стиль интерьера как набор линейных ограничений.
 */
export class StyleDefinition {
    /**
     * @param {object} raw
     * @param {string} raw.id
     * @param {string} [raw.name]
     * @param {string} [raw.icon]
     * @param {string} [raw.description]
     * @param {Array<{feature:string, operator:string, threshold:number, group:string, weight?:number}>} raw.constraints
     */
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

    /**
     * Персональная копия стиля с варьированными порогами (seeded, ±0.1 по GDD).
     * Оператор '==' не варьируется (жёсткое требование стиля).
     * @param {import('../../level/rng.js').Rng} rng
     * @param {{delta?: number, idSuffix?: string}} [opts]
     * @returns {StyleDefinition} новый иммутабельный экземпляр
     */
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