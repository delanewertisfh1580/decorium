// =============================================================================
// domain/scoring.js — антикоррозионный фасад для легаси-потребителей
// (ui/dashboard.js, чей исходник недоступен без репозитория). Принимает сырые
// записи state.js, конвертирует в доменные сущности и ДЕЛЕГИРУЕТ всю математику
// StyleScorer/ErgonomicsScorer. Собственной математики НЕ содержит.
// =============================================================================

import { STYLES } from './styles.js';
import { FEATURE_COUNT } from './features.js';
import { StyleDefinition } from './value-objects/StyleDefinition.js';
import { Item } from './entities/Item.js';
import { Placement } from './value-objects/Placement.js';
import { FeatureVector } from './value-objects/FeatureVector.js';
import { getItemFeaturesVector } from './itemCatalog.js';
import { StyleScorer } from './services/StyleScorer.js';
import { ErgonomicsScorer } from './services/ErgonomicsScorer.js';
import { LAMBDA, STYLE_WEIGHT, ERGONOMICS_WEIGHT, scoreToStars } from './scoringRules.js';

export { LAMBDA, STYLE_WEIGHT, ERGONOMICS_WEIGHT, scoreToStars };

const styleScorer = new StyleScorer();
const ergoScorer = new ErgonomicsScorer();

const ZERO_GROUPS = { 'Цвет': 0, 'Материалы': 0, 'Геометрия': 0, 'Структура': 0 };

/** Сырая запись state.js → доменная сущность Item. */
function toEntity(record) {
    return new Item({
        id: record.id,
        type: record.type,
        placement: new Placement({
            x: record.x, y: record.y ?? 0, z: record.z,
            w: record.w, d: record.d, h: record.h
        }),
        features: new FeatureVector(getItemFeaturesVector(record))
    });
}

/**
 * Полная оценка комнаты в легаси-контракте (raw records на входе).
 * @param {Array<object>} items сырые записи state.js
 * @param {string} styleId
 * @param {{minX,maxX,minZ,maxZ}|null} roomBounds
 * @param {{useAreaWeights?: boolean}} [options]
 */
export function evaluateRoom(items, styleId, roomBounds = null, options = {}) {
    if (!Array.isArray(items) || items.length === 0) {
        return {
            totalScore: 0, stars: 1, styleScore: 0, ergonomicsScore: 0,
            roomVector: new Array(FEATURE_COUNT).fill(0),
            groupScores: { ...ZERO_GROUPS },
            violations: [], itemCount: 0, empty: true
        };
    }

    const entities = items.map(toEntity);

    const rawStyle = STYLES[styleId];
    const styleDef = rawStyle ? new StyleDefinition(rawStyle) : null;

    const styleResult = styleDef
        ? styleScorer.score(entities, styleDef, options.useAreaWeights ?? false)
        : {
            score: 0, violations: [], groupScores: {},
            roomVector: new Array(FEATURE_COUNT).fill(0), totalPenalty: 0
        };

    const ergoResult = ergoScorer.score(entities, roomBounds);

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