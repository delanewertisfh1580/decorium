// =============================================================================
// level/levelLoader.js — декларативный пайплайн уровня (Шаг Г):
// seeded-генератор → JSON (TaskContract) → валидация схемой → нормализация.
// JSON — единственный источник правды для сборки сцены (Compiled AI-подход:
// данные отделены от рантайма, рантайм детерминирован).
// =============================================================================

import { makeTask } from './task.js';
import { validateTaskContract } from './schema.js';

/**
 * Сериализует TaskContract в plain JSON (без функций и классов).
 * @param {object} task
 * @returns {object}
 */
export function taskToLevelJson(task) {
    return JSON.parse(JSON.stringify({
        seed: task.seed,
        styleId: task.styleId,
        layout: task.layout,
        rooms: task.rooms,
        wishes: task.wishes,
        anims: task.anims
    }));
}

/**
 * Валидирует JSON уровня и возвращает нормализованный TaskContract.
 * Бросает Error с перечнем нарушений схемы, если JSON невалиден.
 * @param {object} json
 * @returns {object} TaskContract
 */
export function loadLevelFromJson(json) {
    const check = validateTaskContract(json);
    if (!check.ok) {
        throw new Error('levelLoader: схема нарушена — ' + check.errors.join('; '));
    }
    return {
        seed: json.seed,
        styleId: json.styleId,
        layout: json.layout,
        rooms: json.layout ? json.layout.rooms : json.rooms,
        wishes: Array.isArray(json.wishes) ? json.wishes : [],
        anims: Array.isArray(json.anims) ? json.anims : []
    };
}

/**
 * Полный пайплайн: seed → генератор → JSON → схема → TaskContract.
 * Один seed — один и тот же JSON и одна и та же сцена.
 * @param {{clientId?: string, levelId?: number}} opts
 * @returns {{json: object, task: object}}
 */
export function makeLevel({ clientId = 'default', levelId = 1 }) {
    const generated = makeTask({ clientId, levelId });
    const json = taskToLevelJson(generated);
    const task = loadLevelFromJson(json);
    return { json, task };
}