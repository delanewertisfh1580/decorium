// =============================================================================
// level/schema.js — валидация декларативного уровня (TaskContract/JSON).
// Шаг Г: уровень — данные; рантайм детерминирован (Compiled AI-подход).
// =============================================================================

import { STYLES } from '../domain/styles.js';

const ANIM_KINDS = ['tv', 'cat', 'dog', 'floorlamp', 'plant'];
const FEATURE_OPS = ['>=', '<=', '=='];

/**
 * Проверяет JSON уровня на соответствие контракту.
 * @param {object} t TaskContract (plain JSON)
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateTaskContract(t) {
    const errors = [];

    if (!t || typeof t !== 'object') return { ok: false, errors: ['level: не объект'] };

    if (typeof t.seed !== 'string' || t.seed.length === 0) errors.push('seed: пустой или не строка');
    if (typeof t.styleId !== 'string' || !STYLES[t.styleId]) errors.push(`styleId: неизвестный стиль "${t.styleId}"`);

    if (!Array.isArray(t.rooms) || t.rooms.length < 1) {
        errors.push('rooms: минимум одна комната обязательна');
    } else {
        t.rooms.forEach((r, i) => {
            if (typeof r.w !== 'number' || r.w < 2 || r.w > 12) errors.push(`rooms[${i}].w вне [2,12]`);
            if (typeof r.d !== 'number' || r.d < 2 || r.d > 12) errors.push(`rooms[${i}].d вне [2,12]`);
            if (typeof r.x !== 'number' || typeof r.z !== 'number') errors.push(`rooms[${i}]: нет центра x/z`);
        });
    }

    if (t.layout) {
        if (typeof t.layout.W !== 'number' || typeof t.layout.D !== 'number') errors.push('layout.W/D: числа обязательны');
        if (!Array.isArray(t.layout.doors)) errors.push('layout.doors: массив обязателен');
    }

    if (t.wishes !== undefined) {
        if (!Array.isArray(t.wishes)) errors.push('wishes: должен быть массивом');
        else t.wishes.forEach((w, i) => {
            const hasFeature = typeof w.feature === 'string';
            const hasRule = typeof w.rule === 'string';
            if (!hasFeature && !hasRule) errors.push(`wishes[${i}]: нужен feature или rule`);
            if (hasFeature && !FEATURE_OPS.includes(w.op)) errors.push(`wishes[${i}].op: недопустимый оператор`);
            if (typeof w.thr !== 'number') errors.push(`wishes[${i}].thr: число обязательно`);
            if (typeof w.text !== 'string') errors.push(`wishes[${i}].text: строка обязательна`);
        });
    }

    if (t.anims !== undefined) {
        if (!Array.isArray(t.anims)) errors.push('anims: должен быть массивом');
        else t.anims.forEach((a, i) => {
            if (!ANIM_KINDS.includes(a)) errors.push(`anims[${i}]: неизвестный проп "${a}"`);
        });
    }

    return { ok: errors.length === 0, errors };
}