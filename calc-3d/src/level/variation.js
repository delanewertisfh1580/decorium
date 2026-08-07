// =============================================================================
// level/variation.js — seeded-вариация порогов стиля b_i += rand[-0.1, +0.1]
// (по GDD). Регистрирует «персональный» стиль в STYLES под отдельным id ПОСЛЕ
// инициализации дашборда — селект стилей в UI не засоряется, а evaluateRoom
// подхватывает варьированные ограничения без правок domain/scoring.js.
// =============================================================================

import { STYLES } from '../domain/styles.js';

const SUFFIX = '__client';

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

/**
 * Создаёт и регистрирует копию стиля с варьированными порогами.
 * @param {string} styleId базовый стиль
 * @param {import('./rng.js').Rng} rng seeded-поток уровня
 * @returns {string} id зарегистрированного персонального стиля
 */
export function registerVariedStyle(styleId, rng) {
    const base = STYLES[styleId];
    if (!base) return styleId;

    const variedId = styleId + SUFFIX;
    if (STYLES[variedId]) return variedId;

    STYLES[variedId] = {
        ...base,
        id: variedId,
        constraints: (base.constraints || []).map((c) => {
            // Оператор '==' не варьируем — это жёсткое требование стиля.
            if (c.operator === '==') return { ...c };
            return { ...c, threshold: clamp01(c.threshold + rng.range(-0.1, 0.1)) };
        })
    };

    return variedId;
}