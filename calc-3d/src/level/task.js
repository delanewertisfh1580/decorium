// =============================================================================
// level/task.js — TaskContract из seed (stateless, детерминированно).
// Шаг В: rooms = BSP-layout; число комнат по тиру GDD.
// =============================================================================

import { Rng } from './rng.js';
import { STYLES } from '../domain/styles.js';
import { buildLayout } from './bsp.js';

const WISHES_POOL = [
    { feature: 'warmth', op: '>=', thr: 0.6, text: 'хочу тёплые оттенки' },
    { feature: 'lightness', op: '>=', thr: 0.7, text: 'нужно больше света' },
    { rule: 'passage', thr: 1.0, text: 'нужны широкие проходы' }
];

const ANIM_POOL = ['tv', 'cat', 'floorlamp', 'plant', 'dog'];

/**
 * Собирает TaskContract. Один seed — один уровень.
 * @param {{clientId?: string, levelId?: number}} opts
 */
export function makeTask({ clientId = 'default', levelId = 1 }) {
    const seed = `${clientId}·level${levelId}`;
    const rng = new Rng(seed);

    const styleId = rng.pick(Object.keys(STYLES));

    // Тиры GDD: 1–5 одна комната, 6–15 две, 16–35 до трёх, 36+ до четырёх.
    let roomCount;
    if (levelId <= 5) roomCount = 1;
    else if (levelId <= 15) roomCount = 2;
    else if (levelId <= 35) roomCount = rng.irange(2, 3);
    else roomCount = rng.irange(3, 4);

    let W, D;
    if (roomCount === 1) {
        W = Math.round(rng.range(4, 6) * 2) / 2;
        D = Math.round(rng.range(3, 5) * 2) / 2;
    } else {
        W = Math.round(rng.range(7, 9.5) * 2) / 2;
        D = Math.round(rng.range(5, 7.5) * 2) / 2;
    }

    const layout = buildLayout(rng, W, D, roomCount);

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
        layout,
        rooms: layout.rooms,
        wishes,
        anims
    };
}