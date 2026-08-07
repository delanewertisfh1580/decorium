import { describe, it, expect } from 'vitest';
import { Placement } from '../../src/domain/value-objects/Placement.js';

describe('Placement (Value Object)', () => {
    const p = new Placement({ x: 1, y: 0, z: 2, w: 2, d: 1, h: 0.5 });

    it('иммутабелен', () => {
        expect(Object.isFrozen(p)).toBe(true);
        expect(() => { p.x = 99; }).toThrow();
    });

    it('считает площадь следа и объём', () => {
        expect(p.footprintArea).toBe(2);
        expect(p.volume).toBe(1);
    });

    it('distanceTo — по плоскости XZ', () => {
        const q = new Placement({ x: 4, y: 9, z: 2, w: 1, d: 1, h: 1 });
        expect(p.distanceTo(q)).toBe(3);
    });

    it('валидирует вход', () => {
        expect(() => new Placement({ x: 0, y: 0, z: 0, w: 0, d: 1, h: 1 })).toThrow();
        expect(() => new Placement({ x: NaN, y: 0, z: 0, w: 1, d: 1, h: 1 })).toThrow();
    });
});