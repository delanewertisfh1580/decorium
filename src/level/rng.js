// =============================================================================
// level/rng.js — детерминированный ГПСЧ (статья о персонализации: stateless,
// прямой доступ, воспроизводимость). Один seed — одна последовательность.
// =============================================================================

/** cyrb53: строка → 53-битный хеш. */
export function hashString(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** mulberry32: быстрый статистически надёжный генератор. */
export function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Seeded-поток: range/irange/pick/shuffle. Без Math.random(). */
export class Rng {
    /** @param {string|number} seed */
    constructor(seed) {
        this.seed = typeof seed === 'string' ? hashString(seed) : seed;
        this.next = mulberry32(this.seed);
    }

    /** [min, max) */
    range(min, max) { return min + this.next() * (max - min); }

    /** [min, max] целое */
    irange(min, max) { return Math.floor(this.range(min, max + 1)); }

    pick(arr) { return arr[this.irange(0, arr.length - 1)]; }

    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = this.irange(0, i);
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}