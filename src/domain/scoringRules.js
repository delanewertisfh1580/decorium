// =============================================================================
// domain/scoringRules.js — константы и шкалы оценки из GDD.
// =============================================================================

export const LAMBDA = 1.5;
export const STYLE_WEIGHT = 0.7;
export const ERGONOMICS_WEIGHT = 0.3;

export const STAR_THRESHOLDS = [
    { min: 0.86, stars: 5 },
    { min: 0.71, stars: 4 },
    { min: 0.56, stars: 3 },
    { min: 0.40, stars: 2 },
    { min: 0.00, stars: 1 }
];

export function scoreToStars(score) {
    for (const t of STAR_THRESHOLDS) {
        if (score >= t.min) return t.stars;
    }
    return 1;
}