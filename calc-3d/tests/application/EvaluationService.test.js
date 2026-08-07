import { describe, it, expect } from 'vitest';
import { EvaluationService } from '../../src/application/EvaluationService.js';
import { StyleScorer } from '../../src/domain/services/StyleScorer.js';
import { ErgonomicsScorer } from '../../src/domain/services/ErgonomicsScorer.js';
import { StyleRepository } from '../../src/domain/repositories/StyleRepository.js';
import { Item } from '../../src/domain/entities/Item.js';
import { Placement } from '../../src/domain/value-objects/Placement.js';
import { FeatureVector } from '../../src/domain/value-objects/FeatureVector.js';
import { FEATURE_INDEX, FEATURE_COUNT } from '../../src/domain/features.js';

// Предмет, полностью соответствующий скандинавскому стилю
function scandiItem(id, x, z) {
    const arr = new Array(FEATURE_COUNT).fill(0);
    arr[FEATURE_INDEX.wood_ratio] = 1;
    arr[FEATURE_INDEX.lightness] = 1;
    arr[FEATURE_INDEX.simplicity] = 1;
    arr[FEATURE_INDEX.warmth] = 1;
    return new Item({
        id, type: 'box',
        placement: new Placement({ x, y: 0, z, w: 1, d: 1, h: 0.5 }),
        features: new FeatureVector(arr)
    });
}

function makeService(items) {
    return new EvaluationService({
        itemRepository: { getAll: () => items },
        styleRepository: new StyleRepository(),
        styleScorer: new StyleScorer(),
        ergonomicsScorer: new ErgonomicsScorer()
    });
}

const BOUNDS = { minX: -4, maxX: 4, minZ: -4, maxZ: 4 };

describe('EvaluationService (Application Service)', () => {
    it('пустая комната → empty-результат', () => {
        const res = makeService([]).evaluate({ styleId: 'scandinavian', bounds: BOUNDS });
        expect(res.empty).toBe(true);
        expect(res.stars).toBe(1);
    });

    it('идеальный стиль + простор → 5 звёзд', () => {
        const res = makeService([scandiItem(1, -2, 0), scandiItem(2, 2, 0)])
            .evaluate({ styleId: 'scandinavian', bounds: BOUNDS });
        expect(res.empty).toBe(false);
        expect(res.totalScore).toBe(1);
        expect(res.stars).toBe(5);
    });

    it('wish клиента снижает итог и попадает в отчёт', () => {
        const items = [scandiItem(1, -2, 0), scandiItem(2, 2, 0)];
        const base = makeService(items).evaluate({ styleId: 'scandinavian', bounds: BOUNDS });
        const withWish = makeService(items).evaluate({
            styleId: 'scandinavian',
            bounds: BOUNDS,
            wishes: [{ feature: 'warmth', op: '<=', thr: 0.2, text: 'не хочу тёплых тонов' }]
        });

        expect(withWish.wishes[0].satisfied).toBe(false);
        expect(withWish.totalScore).toBeLessThan(base.totalScore);
        expect(withWish.stars).toBeLessThan(base.stars);
    });
});