import { describe, it, expect } from 'vitest';
import { FeatureVector } from '../../src/domain/value-objects/FeatureVector.js';
import { FEATURE_COUNT } from '../../src/domain/features.js';

const ones = new FeatureVector(new Array(FEATURE_COUNT).fill(1));
const zeros = new FeatureVector(new Array(FEATURE_COUNT).fill(0));

describe('FeatureVector (Value Object)', () => {
    it('иммутабелен и правильной длины', () => {
        expect(ones.length).toBe(FEATURE_COUNT);
        expect(Object.isFrozen(ones.values)).toBe(true);
        expect(() => { ones.values[0] = 5; }).toThrow();
    });

    it('get() с границами', () => {
        expect(ones.get(0)).toBe(1);
        expect(() => ones.get(FEATURE_COUNT)).toThrow();
    });

    it('weightedAverage: веса 3:1 → 0.75', () => {
        const avg = FeatureVector.weightedAverage([ones, zeros], [3, 1]);
        expect(avg.get(0)).toBeCloseTo(0.75, 9);
    });

    it('отклоняет неверную длину', () => {
        expect(() => new FeatureVector([1, 2, 3])).toThrow();
    });
});