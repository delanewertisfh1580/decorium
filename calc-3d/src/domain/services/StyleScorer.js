// =============================================================================
// domain/services/StyleScorer.js — Domain Service оценки стиля.
// Чистая математика GDD: вектор комнаты → нарушения → penalty → exp(-λ·p).
// =============================================================================

import { FEATURE_INDEX } from '../features.js';
import { FeatureVector } from '../value-objects/FeatureVector.js';
import { LAMBDA } from '../scoringRules.js';

export class StyleScorer {
    /** @param {{lambda?: number}} [opts] */
    constructor({ lambda = LAMBDA } = {}) {
        this.lambda = lambda;
    }

    /**
     * Вектор комнаты = среднее (взвешенное по площади следа) векторов предметов.
     * @param {import('../entities/Item.js').Item[]} items
     * @param {boolean} [useAreaWeights]
     * @returns {FeatureVector}
     */
    computeRoomVector(items, useAreaWeights = false) {
        const vectors = items.map((i) => i.features);
        const weights = useAreaWeights
            ? items.map((i) => Math.max(0.1, i.placement.footprintArea))
            : null;
        return FeatureVector.weightedAverage(vectors, weights);
    }

    /**
     * Величина нарушения одного ограничения (0, если выполнено).
     * @param {object} constraint
     * @param {FeatureVector} roomVector
     * @returns {number}
     */
    constraintViolation(constraint, roomVector) {
        const idx = FEATURE_INDEX[constraint.feature];
        if (idx === undefined) return 0;
        const value = roomVector.get(idx);

        switch (constraint.operator) {
            case '>=': return Math.max(0, constraint.threshold - value);
            case '<=': return Math.max(0, value - constraint.threshold);
            case '==': return Math.abs(value - constraint.threshold);
            default: return 0;
        }
    }

    /**
     * Оценка стиля для набора Item-сущностей.
     * @param {import('../entities/Item.js').Item[]} items
     * @param {import('../value-objects/StyleDefinition.js').StyleDefinition} style
     * @param {boolean} [useAreaWeights]
     */
    score(items, style, useAreaWeights = false) {
        if (!items || items.length === 0) {
            return {
                score: 0, violations: [], groupScores: {},
                roomVector: new Array(Object.keys(FEATURE_INDEX).length).fill(0),
                totalPenalty: 0
            };
        }

        const roomVector = this.computeRoomVector(items, useAreaWeights);

        let totalPenalty = 0;
        const groupPenalties = {};
        const violations = [];

        for (const c of style.constraints) {
            const violation = this.constraintViolation(c, roomVector);
            if (violation > 0) {
                const penalty = violation * (c.weight ?? 1);
                totalPenalty += penalty;
                groupPenalties[c.group] = (groupPenalties[c.group] ?? 0) + penalty;

                violations.push({
                    type: 'style',
                    feature: c.feature,
                    group: c.group,
                    operator: c.operator,
                    threshold: c.threshold,
                    value: +roomVector.get(FEATURE_INDEX[c.feature]).toFixed(3),
                    deficit: +violation.toFixed(3)
                });
            }
        }

        const groupScores = {};
        for (const [group, penalty] of Object.entries(groupPenalties)) {
            groupScores[group] = Math.exp(-this.lambda * penalty);
        }

        return {
            score: Math.exp(-this.lambda * totalPenalty),
            violations,
            groupScores,
            roomVector: roomVector.values,
            totalPenalty: +totalPenalty.toFixed(3)
        };
    }
}