/**
 * Детерминированный ГПСЧ для процедурной генерации.
 * Использует cyrb53 для хеширования seed и mulberry32 для генерации.
 */

export function hashString(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
        let ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function mulberry32(seed) {
    let a = seed;
    return function() {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export class Rng {
    constructor(seedString) {
        this.seed = typeof seedString === 'string' ? hashString(seedString) : seedString;
        this.next = mulberry32(this.seed);
    }
    range(min, max) { return min + this.next() * (max - min); }
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