// =============================================================================
// domain/scoringRules.js — константы и шкалы оценки из GDD.
// Единственный источник правды для λ, весов компонент и звёздной шкалы.
// =============================================================================

/** Коэффициент крутизны экспоненты (λ из GDD). */
export const LAMBDA = 1.5;

/** Веса компонент итогового рейтинга (GDD: стиль важнее эргономики). */
export const STYLE_WEIGHT = 0.7;
export const ERGONOMICS_WEIGHT = 0.3;

/** Границы звёздной шкалы из GDD. */
export const STAR_THRESHOLDS = [
    { min: 0.86, stars: 5 },
    { min: 0.71, stars: 4 },
    { min: 0.56, stars: 3 },
    { min: 0.40, stars: 2 },
    { min: 0.00, stars: 1 }
];

/**
 * Конвертирует итоговый балл (0..1) в звёзды (1..5) по шкале GDD.
 * @param {number} score
 * @returns {number}
 */
export function scoreToStars(score) {
    for (const t of STAR_THRESHOLDS) {
        if (score >= t.min) return t.stars;
    }
    return 1;
}