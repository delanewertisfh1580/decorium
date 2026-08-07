import { Rng } from './rng.js';
import { STYLES } from '../domain/styles.js';

const ROOM_TYPES = ['living', 'bedroom', 'studio'];
const WISHES_POOL = [
    { feature: 'warmth', op: '>=', thr: 0.6, text: 'хочу тёплые оттенки' },
    { feature: 'lightness', op: '>=', thr: 0.7, text: 'нужно больше света' },
    { rule: 'passage', thr: 1.0, text: 'нужны широкие проходы' }
];

export function makeTask({ clientId = 'default', levelId = 1 }) {
    const seed = `${clientId}·level${levelId}`;
    const rng = new Rng(seed);

    const styleIds = Object.keys(STYLES);
    const styleId = rng.pick(styleIds);

    const w = Math.round(rng.range(4, 6) * 2) / 2;
    const d = Math.round(rng.range(3, 5) * 2) / 2;

    const wishCount = rng.irange(0, 2);
    const wishes = [];
    const shuffledWishes = rng.shuffle(WISHES_POOL);
    for (let i = 0; i < wishCount; i++) {
        wishes.push(shuffledWishes[i]);
    }

    return {
        seed,
        styleId,
        rooms: [{ type: rng.pick(ROOM_TYPES), w, d }],
        wishes,
        anims: []
    };
}