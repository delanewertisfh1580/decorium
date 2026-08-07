// =============================================================================
// application/EvaluationService.js — Application Service: оркестрация оценки.
// Зависит ТОЛЬКО от domain (сервисы, репозитории, scoringRules).
// =============================================================================

import { LAMBDA, STYLE_WEIGHT, ERGONOMICS_WEIGHT, scoreToStars } from '../domain/scoringRules.js';
import { FEATURE_INDEX } from '../domain/features.js';

export class EvaluationService {
    /**
     * @param {object} deps
     * @param {object} deps.itemRepository
     * @param {import('../domain/services/StyleScorer.js').StyleScorer} deps.styleScorer
     * @param {import('../domain/services/ErgonomicsScorer.js').ErgonomicsScorer} deps.ergonomicsScorer
     * @param {import('../domain/repositories/StyleRepository.js').StyleRepository} deps.styleRepository
     */
    constructor({ itemRepository, styleScorer, ergonomicsScorer, styleRepository }) {
        if (!itemRepository) throw new Error('EvaluationService: itemRepository обязателен');
        if (!styleScorer) throw new Error('EvaluationService: styleScorer обязателен');
        if (!ergonomicsScorer) throw new Error('EvaluationService: ergonomicsScorer обязателен');
        if (!styleRepository) throw new Error('EvaluationService: styleRepository обязателен');

        this.itemRepository = itemRepository;
        this.styleScorer = styleScorer;
        this.ergonomicsScorer = ergonomicsScorer;
        this.styleRepository = styleRepository;
    }

    /**
     * Полная оценка дизайна.
     * @param {object} params
     * @param {string} params.styleId
     * @param {object|null} [params.bounds]
     * @param {object[]} [params.wishes]
     * @param {object[]|null} [params.rooms]
     * @param {Function|null} [params.roomAt]
     * @param {object|null} [params.active]
     * @param {boolean} [params.useAreaWeights]
     */
    evaluate({ styleId, bounds = null, wishes = [], rooms = null, roomAt = null, active = null, useAreaWeights = false }) {
        const items = this.itemRepository.getAll();
        if (items.length === 0) return this._emptyResult(0);

        const style = this.styleRepository.getById(styleId);
        if (!style) return this._emptyResult(items.length);

        let base;
        if (rooms && rooms.length > 1 && roomAt && active) {
            base = this._evaluateApartment(items, style, rooms, roomAt, active, useAreaWeights);
        } else {
            base = this._evaluateSingle(items, style, bounds, useAreaWeights);
            base.perRoom = [];
        }

        return this._applyWishes(base, items, wishes);
    }

    _evaluateSingle(items, style, bounds, useAreaWeights) {
        const styleResult = this.styleScorer.score(items, style, useAreaWeights);
        const ergoResult = this.ergonomicsScorer.score(items, bounds);

        const totalScore = STYLE_WEIGHT * styleResult.score + ERGONOMICS_WEIGHT * ergoResult.score;

        const groupScores = { ...styleResult.groupScores, Структура: ergoResult.score };
        for (const g of ['Цвет', 'Материалы', 'Геометрия', 'Структура']) {
            if (!(g in groupScores)) groupScores[g] = 1;
        }

        return {
            totalScore: +totalScore.toFixed(3),
            stars: scoreToStars(totalScore),
            styleScore: +styleResult.score.toFixed(3),
            ergonomicsScore: +ergoResult.score.toFixed(3),
            roomVector: styleResult.roomVector,
            groupScores,
            violations: [...styleResult.violations, ...ergoResult.violations],
            itemCount: items.length,
            empty: false
        };
    }

    _evaluateApartment(items, style, rooms, roomAt, active, useAreaWeights) {
        const perRoom = [];
        const violations = [];
        let areaSum = 0, wTotal = 0, wStyle = 0, wErgo = 0;
        let vecAcc = null;
        const groupAcc = {};

        for (const r of rooms) {
            const inRoom = items.filter((it) => roomAt(it.placement.x, it.placement.z) === r.id);
            const cx = r.x - active.x;
            const cz = r.z - active.z;
            const roomBounds = {
                minX: cx - r.w / 2, maxX: cx + r.w / 2,
                minZ: cz - r.d / 2, maxZ: cz + r.d / 2
            };

            const res = inRoom.length > 0
                ? this._evaluateSingle(inRoom, style, roomBounds, useAreaWeights)
                : null;

            perRoom.push({
                roomId: r.id,
                stars: res ? res.stars : 0,
                totalScore: res ? res.totalScore : 0,
                empty: !res
            });

            if (res) {
                res.violations.forEach((v) => violations.push({ ...v, room: r.id }));
                const area = r.w * r.d;
                areaSum += area;
                wTotal += res.totalScore * area;
                wStyle += res.styleScore * area;
                wErgo += res.ergonomicsScore * area;
                if (res.roomVector) {
                    if (!vecAcc) vecAcc = res.roomVector.map((v) => v * area);
                    else vecAcc = vecAcc.map((v, i) => v + res.roomVector[i] * area);
                }
                for (const [k, v] of Object.entries(res.groupScores || {})) {
                    groupAcc[k] = (groupAcc[k] || 0) + v * area;
                }
            }
        }

        if (areaSum === 0) return { ...this._emptyResult(items.length), perRoom };

        const groupScores = {};
        for (const [k, v] of Object.entries(groupAcc)) groupScores[k] = +(v / areaSum).toFixed(3);

        const totalScore = wTotal / areaSum;
        return {
            totalScore: +totalScore.toFixed(3),
            stars: scoreToStars(totalScore),
            styleScore: +(wStyle / areaSum).toFixed(3),
            ergonomicsScore: +(wErgo / areaSum).toFixed(3),
            roomVector: vecAcc ? vecAcc.map((v) => +(v / areaSum).toFixed(3)) : null,
            groupScores,
            violations,
            itemCount: items.length,
            empty: false,
            perRoom
        };
    }

    _applyWishes(base, items, wishes) {
        if (!Array.isArray(wishes) || wishes.length === 0) {
            return { ...base, wishes: [] };
        }

        let pStyle = 0, pErgo = 0;
        const wishReport = [];

        for (const wish of wishes) {
            let margin = 0;
            if (typeof wish.feature === 'string') {
                margin = this._featureWishMargin(wish, base.roomVector);
                pStyle += margin * (wish.weight || 1);
            } else if (wish.rule === 'passage') {
                margin = this._passageWishMargin(items, wish.thr);
                pErgo += margin * (wish.weight || 1);
            }

            const satisfied = margin <= 1e-6;
            wishReport.push({ text: wish.text, satisfied, margin: +margin.toFixed(3) });
            if (!satisfied) {
                base.violations.push({
                    type: 'wish',
                    group: 'Пожелания клиента',
                    text: wish.text,
                    penalty: +margin.toFixed(3)
                });
            }
        }

        const styleAdj = base.styleScore * Math.exp(-LAMBDA * pStyle);
        const ergoAdj = base.ergonomicsScore * Math.exp(-LAMBDA * pErgo);
        const totalScore = STYLE_WEIGHT * styleAdj + ERGONOMICS_WEIGHT * ergoAdj;

        return {
            ...base,
            styleScore: +styleAdj.toFixed(3),
            ergonomicsScore: +ergoAdj.toFixed(3),
            totalScore: +totalScore.toFixed(3),
            stars: scoreToStars(totalScore),
            wishes: wishReport
        };
    }

    _featureWishMargin(wish, roomVector) {
        const idx = FEATURE_INDEX[wish.feature];
        if (idx === undefined || !roomVector) return 0;
        const v = roomVector[idx];
        if (typeof v !== 'number') return 0;
        if (wish.op === '>=') return Math.max(0, wish.thr - v);
        if (wish.op === '<=') return Math.max(0, v - wish.thr);
        return Math.max(0, Math.abs(v - wish.thr) - 0.05);
    }

    _passageWishMargin(items, thr) {
        let margin = 0;
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const a = items[i].placement;
                const b = items[j].placement;
                const ra = Math.max(a.w, a.d) / 2;
                const rb = Math.max(b.w, b.d) / 2;
                const gap = a.distanceTo(b) - (ra + rb);
                if (gap < thr) margin += (thr - gap);
            }
        }
        return Math.min(1.5, margin * 0.3);
    }

    _emptyResult(itemCount) {
        return {
            totalScore: 0, stars: 1, styleScore: 0, ergonomicsScore: 0,
            roomVector: null, groupScores: {}, violations: [],
            itemCount, empty: true, perRoom: [], wishes: []
        };
    }
}