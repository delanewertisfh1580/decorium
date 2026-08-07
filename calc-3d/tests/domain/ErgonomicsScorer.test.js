import { describe, it, expect } from 'vitest';
import { ErgonomicsScorer, MIN_PASSAGE } from '../../src/domain/services/ErgonomicsScorer.js';
import { Item } from '../../src/domain/entities/Item.js';
import { Placement } from '../../src/domain/value-objects/Placement.js';
import { FeatureVector } from '../../src/domain/value-objects/FeatureVector.js';
import { FEATURE_COUNT } from '../../src/domain/features.js';

const fv = new FeatureVector(new Array(FEATURE_COUNT).fill(0.5));

function box(id, x, z, opts = {}) {
    return new Item({
        id, type: opts.type || 'box',
        placement: new Placement({ x, y: 0, z, w: opts.w || 1, d: opts.d || 1, h: opts.h || 0.5 }),
        features: fv
    });
}

const BOUNDS = { minX: -3, maxX: 3, minZ: -3, maxZ: 3 };

describe('ErgonomicsScorer (Domain Service)', () => {
    const scorer = new ErgonomicsScorer();

    it('узкий проход → нарушение passage', () => {
        const res = scorer.score([box(1, 0, 0), box(2, 0.6, 0)], BOUNDS);
        const v = res.violations.find(v => v.rule === 'passage');
        expect(v).toBeTruthy();
        expect(v.deficit).toBeGreaterThan(0);
        expect(res.score).toBeLessThan(1);
    });

    it('широкий проход → нет нарушения passage', () => {
        const res = scorer.score([box(1, -2, 0), box(2, 2, 0)], BOUNDS);
        expect(res.violations.filter(v => v.rule === 'passage')).toHaveLength(0);
    });

    it('столик выше сиденья дивана рядом → height_ratio', () => {
        const sofa = box(1, 0, 0, { type: 'sofa', h: 0.8 });
        const table = box(2, 1.0, 0, { type: 'box', h: 0.6 });
        const res = scorer.score([sofa, table], BOUNDS);
        expect(res.violations.some(v => v.rule === 'height_ratio')).toBe(true);
    });

    it('кластер в углу штрафуется сильнее, чем равномерная раскладка', () => {
        const clustered = scorer.score([box(1, 0, 0), box(2, 0.4, 0), box(3, 0, 0.4)], BOUNDS);
        const spread = scorer.score([box(1, -2, -2), box(2, 0, 0), box(3, 2, 2)], BOUNDS);
        expect(clustered.checks.balance.penalty).toBeGreaterThan(spread.checks.balance.penalty);
    });

    it('MIN_PASSAGE = 0.9 м (GDD)', () => {
        expect(MIN_PASSAGE).toBe(0.9);
    });
});