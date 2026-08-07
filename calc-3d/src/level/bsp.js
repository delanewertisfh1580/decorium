// =============================================================================
// level/bsp.js — seeded BSP-деление прямоугольного футпринта на комнаты.
// Двери создаются между сиблингами дерева BSP на общей границе —
// связность квартиры гарантирована построением (остов = дерево BSP).
// Никакого Math.random() — только Rng.
// =============================================================================

export const ROOM_LABELS = {
    living: 'Гостиная',
    bedroom: 'Спальня',
    study: 'Кабинет',
    kitchen: 'Кухня'
};

const MIN_W = 2.4;
const MIN_D = 2.2;

/**
 * Строит планировку квартиры: комнаты {id,type,x,z,w,d} (x,z — центр в layout-
 * координатах, футпринт центрирован в нуле) и двери между смежными комнатами.
 * @param {import('./rng.js').Rng} rng
 * @param {number} W ширина футпринта
 * @param {number} D глубина футпринта
 * @param {number} roomCount целевое число комнат (2..4)
 * @returns {{rooms: object[], doors: object[], W: number, D: number}}
 */
export function buildLayout(rng, W, D, roomCount) {
    const nodes = [{ x: 0, z: 0, w: W, d: D }];
    const doors = [];

    while (nodes.length < roomCount) {
        let bi = 0;
        for (let i = 1; i < nodes.length; i++) {
            if (nodes[i].w * nodes[i].d > nodes[bi].w * nodes[bi].d) bi = i;
        }
        const n = nodes.splice(bi, 1)[0];
        const splitByWidth = n.w >= n.d;
        const t = rng.range(0.35, 0.65);

        if (splitByWidth) {
            const wa = Math.min(n.w - MIN_W, Math.max(MIN_W, n.w * t));
            const wb = n.w - wa;
            const a = { x: n.x - n.w / 2 + wa / 2, z: n.z, w: wa, d: n.d };
            const b = { x: n.x + n.w / 2 - wb / 2, z: n.z, w: wb, d: n.d };
            doors.push({
                axis: 'x',
                at: n.x - n.w / 2 + wa,
                from: n.z + rng.range(-0.2, 0.2) * n.d,
                width: 1.0,
                lo: n.z - n.d / 2,
                hi: n.z + n.d / 2
            });
            nodes.push(a, b);
        } else {
            const da = Math.min(n.d - MIN_D, Math.max(MIN_D, n.d * t));
            const db = n.d - da;
            const a = { x: n.x, z: n.z - n.d / 2 + da / 2, w: n.w, d: da };
            const b = { x: n.x, z: n.z + n.d / 2 - db / 2, w: n.w, d: db };
            doors.push({
                axis: 'z',
                at: n.z - n.d / 2 + da,
                from: n.x + rng.range(-0.2, 0.2) * n.w,
                width: 1.0,
                lo: n.x - n.w / 2,
                hi: n.x + n.w / 2
            });
            nodes.push(a, b);
        }
    }

    const rooms = nodes.map((r, i) => ({ id: 'r' + i, type: 'bedroom', ...r }));

    let li = 0;
    rooms.forEach((r, i) => { if (r.w * r.d > rooms[li].w * rooms[li].d) li = i; });
    rooms[li].type = 'living';

    const pool = rng.shuffle(['bedroom', 'study', 'kitchen', 'bedroom']);
    let ti = 0;
    rooms.forEach((r) => { if (r.type !== 'living') r.type = pool[ti++ % pool.length]; });

    return { rooms, doors, W, D };
}