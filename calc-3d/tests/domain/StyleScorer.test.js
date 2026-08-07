import { describe, it, expect } from 'vitest';
import { StyleScorer } from '../../src/domain/services/StyleScorer.js';
import { StyleDefinition } from '../../src/domain/value-objects/StyleDefinition.js';
import { Item } from '../../src/domain/entities/Item.js';
import { Placement } from '../../src/domain/value-objects/Placement.js';
import { FeatureVector } from '../../src/domain/value-objects/FeatureVector.js';
import { FEATURE_INDEX, FEATURE_COUNT } from '../../src/domain/features.js';

function makeItem(id, wood) {
    const arr = new Array(FEATURE_COUNT).fill(0);
    arr[FEATURE_INDEX.wood_ratio] = wood;
    return new Item({
        id, type: 'box',
        placement: new Placement({ x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 }),
        features: new FeatureVector(arr)
    });
}

const style = new StyleDefinition({
    id: 'test',
    constraints: [
        { feature: 'wood_ratio', operator: '>=', threshold: 0.5, group: 'Материалы', weight: 1 }
    ]
});

describe('StyleScorer (Domain Service)', () => {
    const scorer = new StyleScorer();

    it('выполненное ограничение → score 1', () => {
        const res = scorer.score([makeItem(1, 1)], style);
        expect(res.score).toBe(1);
        expect(res.violations).toHaveLength(0);
    });

    it('нарушение 0.5 → exp(-1.5·0.5)', () => {
        const res = scorer.score([makeItem(1, 0)], style);
        expect(res.score).toBeCloseTo(Math.exp(-1.5 * 0.5), 9);
        expect(res.violations[0].deficit).toBeCloseTo(0.5, 3);
    });

    it('вектор комнаты = среднее векторов', () => {
        const res = scorer.score([makeItem(1, 1), makeItem(2, 0.5)], style);
        expect(res.roomVector[FEATURE_INDEX.wood_ratio]).toBeCloseTo(0.75, 9);
    });
});