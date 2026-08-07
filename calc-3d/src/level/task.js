// =============================================================================
// level/task.js — генерация TaskContract из seed (stateless, детерминированно).
// Шаг Б: поле anims — список живых пропов уровня.
// Тир 1 (уровни 1–15 по GDD): гарантированный уютный набор.
// =============================================================================

import { Rng } from './rng.js';
import { STYLES } from '../domain/styles.js';

const ROOM_TYPES = ['living', 'bedroom', 'studio'];

const WISHES_POOL = [
    { feature: 'warmth', op: '>=', thr: 0.6, text: 'хочу тёплые оттенки' },
    { feature: 'lightness', op: '>=', thr: 0.7, text: 'нужно больше света' },
    { rule: 'passage', thr: 1.0, text: 'нужны широкие проходы' }
];

const ANIM_POOL = ['tv', 'cat', 'floorlamp', 'plant', 'dog'];

/**
 * Собирает TaskContract для клиента и уровня. Один seed — один уровень.
 * @param {{clientId?: string, levelId?: number}} opts
 * @returns {object} TaskContract
 */
export function makeTask({ clientId = 'default', levelId = 1 }) {
    const seed = `${clientId}·level${levelId}`;
    const rng = new Rng(seed);

    const styleId = rng.pick(Object.keys(STYLES));

    const w = Math.round(rng.range(4, 6) * 2) / 2;
    const d = Math.round(rng.range(3, 5) * 2) / 2;

    const wishes = rng.shuffle(WISHES_POOL).slice(0, rng.irange(0, 2));

    let anims;
    if (levelId <= 15) {
        anims = ['tv', 'cat', 'floorlamp', 'plant'];
        if (rng.range(0, 1) < 0.3) anims = anims.concat('dog');
    } else {
        anims = rng.shuffle(ANIM_POOL).slice(0, rng.irange(3, 4));
        if (!anims.includes('tv')) anims[0] = 'tv';
    }

    return {
        seed,
        styleId,
        rooms: [{ type: rng.pick(ROOM_TYPES), w, d }],
        wishes,
        anims
    };
}