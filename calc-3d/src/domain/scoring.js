// =============================================================================
// scoring.js — Система оценки стиля и итоговый рейтинг комнаты.
// Реализует математическое ядро Decorium из GDD:
//   1. Вектор комнаты = среднее (взвешенное) векторов всех предметов.
//   2. Для каждого ограничения стиля считается величина нарушения.
//   3. Штрафы суммируются с весами ограничений.
//   4. score_стиль = exp(-λ · total_penalty).
//   5. Итоговый балл = 0.7·score_стиль + 0.3·score_эргономика.
//   6. Итоговый балл конвертируется в звёзды (1..5) по шкале из GDD.
// =============================================================================

import { FEATURE_COUNT, FEATURE_INDEX } from './features.js';
import { getStyle } from './styles.js';
import { getItemFeaturesVector } from './itemCatalog.js';
import { evaluateErgonomics, getFootprintArea } from './ergonomics.js';

/** Коэффициент крутизны экспоненты (λ из GDD). */
export const LAMBDA = 1.5;

/** Веса двух компонент итогового рейтинга (из GDD). */
export const STYLE_WEIGHT = 0.7;
export const ERGONOMICS_WEIGHT = 0.3;

/** Границы звёздной шкалы из GDD. */
const STAR_THRESHOLDS = [
  { min: 0.86, stars: 5 },
  { min: 0.71, stars: 4 },
  { min: 0.56, stars: 3 },
  { min: 0.40, stars: 2 },
  { min: 0.00, stars: 1 },
];

/**
 * Вычисляет вектор комнаты как среднее векторов всех предметов.
 * @param {Array<object>} items - размещённые предметы
 * @param {boolean} useAreaWeights - взвешивать по площади следа предмета
 * @returns {number[]} вектор признаков длины FEATURE_COUNT
 */
export function computeRoomVector(items, useAreaWeights = false) {
  if (!Array.isArray(items) || items.length === 0) {
    return new Array(FEATURE_COUNT).fill(0);
  }

  const acc = new Array(FEATURE_COUNT).fill(0);
  let totalWeight = 0;

  for (const item of items) {
    const v = getItemFeaturesVector(item);
    const w = useAreaWeights ? Math.max(0.1, getFootprintArea(item)) : 1;
    for (let i = 0; i < FEATURE_COUNT; i++) {
      acc[i] += v[i] * w;
    }
    totalWeight += w;
  }

  if (totalWeight === 0) return new Array(FEATURE_COUNT).fill(0);
  return acc.map(x => x / totalWeight);
}

/**
 * Возвращает величину нарушения одного ограничения (0, если выполнено).
 * @param {object} constraint - {feature, operator, threshold, weight}
 * @param {number[]} roomVector
 * @returns {number}
 */
export function constraintViolation(constraint, roomVector) {
  const idx = FEATURE_INDEX[constraint.feature];
  if (idx === undefined) return 0;
  const value = roomVector[idx];

  switch (constraint.operator) {
    case '>=':
      return Math.max(0, constraint.threshold - value);
    case '<=':
      return Math.max(0, value - constraint.threshold);
    case '==':
      return Math.abs(value - constraint.threshold);
    default:
      return 0;
  }
}

/**
 * Оценка стиля для набора предметов.
 * @param {Array<object>} items
 * @param {string} styleId
 * @param {number} lambda
 * @returns {{score:number, violations:Array, groupScores:object, roomVector:number[], totalPenalty:number}}
 */
export function evaluateStyle(items, styleId, lambda = LAMBDA) {
  const style = getStyle(styleId);
  if (!style) {
    return {
      score: 0, violations: [], groupScores: {},
      roomVector: new Array(FEATURE_COUNT).fill(0), totalPenalty: 0,
    };
  }

  const roomVector = computeRoomVector(items);

  let totalPenalty = 0;
  const violations = [];
  const groupPenalties = {};

  for (const c of style.constraints) {
    const violation = constraintViolation(c, roomVector);
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
        value: +roomVector[FEATURE_INDEX[c.feature]].toFixed(3),
        deficit: +violation.toFixed(3),
      });
    }
  }

  const score = Math.exp(-lambda * totalPenalty);

  // Суб-оценки по группам (для лепестковой диаграммы)
  const groupScores = {};
  for (const [group, penalty] of Object.entries(groupPenalties)) {
    groupScores[group] = Math.exp(-lambda * penalty);
  }

  return {
    score,
    violations,
    groupScores,
    roomVector,
    totalPenalty: +totalPenalty.toFixed(3),
  };
}

/**
 * Конвертирует итоговый балл (0..1) в звёзды (1..5) по шкале из GDD.
 * @param {number} score
 * @returns {number}
 */
export function scoreToStars(score) {
  for (const t of STAR_THRESHOLDS) {
    if (score >= t.min) return t.stars;
  }
  return 1;
}

/**
 * Главная функция: полная оценка комнаты (стиль + эргономика + итог + звёзды).
 * @param {Array<object>} items - размещённые предметы
 * @param {string} styleId - целевой стиль
 * @param {{minX,maxX,minZ,maxZ}|null} roomBounds - границы комнаты (опционально)
 * @param {object} options - { lambda, useAreaWeights }
 * @returns {object} полный результат оценки
 */
export function evaluateRoom(items, styleId, roomBounds = null, options = {}) {
  const lambda = options.lambda ?? LAMBDA;
  const useAreaWeights = options.useAreaWeights ?? false;

  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalScore: 0,
      stars: 1,
      styleScore: 0,
      ergonomicsScore: 0,
      roomVector: new Array(FEATURE_COUNT).fill(0),
      groupScores: { 'Цвет': 0, 'Материалы': 0, 'Геометрия': 0, 'Структура': 0 },
      violations: [],
      itemCount: 0,
      empty: true,
    };
  }

  // Повторно вычислим вектор с учётом опции взвешивания
  const roomVector = computeRoomVector(items, useAreaWeights);

  // Оценка стиля (передаём уже вычисленный вектор через items)
  const styleResult = evaluateStyle(items, styleId, lambda);
  const ergoResult = evaluateErgonomics(items, roomBounds, lambda);

  const totalScore = STYLE_WEIGHT * styleResult.score + ERGONOMICS_WEIGHT * ergoResult.score;

  // Собираем суб-оценки для лепестковой диаграммы (Цвет, Материалы, Геометрия, Структура)
  const groupScores = { ...styleResult.groupScores };
  groupScores['Структура'] = ergoResult.score;
  for (const g of ['Цвет', 'Материалы', 'Геометрия', 'Структура']) {
    if (!(g in groupScores)) groupScores[g] = 1;
  }

  return {
    totalScore: +totalScore.toFixed(3),
    stars: scoreToStars(totalScore),
    styleScore: +styleResult.score.toFixed(3),
    ergonomicsScore: +ergoResult.score.toFixed(3),
    roomVector,
    groupScores,
    violations: [...styleResult.violations, ...ergoResult.violations],
    itemCount: items.length,
    empty: false,
  };
}