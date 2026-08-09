// =============================================================================
// level/tone.js — персональный тон клиента (суффиксы-шаблоны из статьи о
// персонализации: адаптация «снаружи», детерминированно, без LLM в рантайме).
// =============================================================================

export const TONES = {
    neutral: {
        label: 'нейтральный',
        wrap: (t) => t
    },
    warm: {
        label: 'тёплый',
        wrap: (t) => `Если можно, ${t.toLowerCase()} — буду очень ждать!`
    },
    demanding: {
        label: 'требовательный',
        wrap: (t) => `Строго: ${t}. Это обязательное условие.`
    },
    dreamy: {
        label: 'мечтательный',
        wrap: (t) => `Мне снится интерьер, где ${t.toLowerCase()}…`
    }
};

const CLIENT_NAMES = ['Анна', 'Максим', 'Полина', 'Игорь', 'Мария', 'Олег', 'София', 'Дмитрий'];

/**
 * Seeded-тон и имя клиента: один clientId — один характер навсегда.
 * @param {string} clientId
 * @param {import('./rng.js').Rng} rng
 * @returns {{toneKey: string, clientName: string}}
 */
export function pickClientPersona(clientId, rng) {
    const toneKeys = Object.keys(TONES);
    return {
        toneKey: rng.pick(toneKeys),
        clientName: rng.pick(CLIENT_NAMES)
    };
}

/**
 * Тир клиента по уровню (GDD: Новичок/Студент/Проф/Эксперт).
 * @param {number} levelId
 */
export function clientTier(levelId) {
    if (levelId <= 15) return 'Новичок';
    if (levelId <= 35) return 'Студент';
    if (levelId <= 50) return 'Проф';
    return 'Эксперт';
}