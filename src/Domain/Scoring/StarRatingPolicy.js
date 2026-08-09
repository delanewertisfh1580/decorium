/**
 * StarRatingPolicy
 *
 * Domain Policy: Преобразует числовой стиль score (0.0 - 1.0) в рейтинг звезд (0-5).
 * Использует пороги из конфигурации scoring-parameters.
 *
 * @dependency domain/Scoring/scoringParameters.js (или загрузка из JSON через Infrastructure)
 */

import { getScoringParameters } from './scoringParameters.js';

export class StarRatingPolicy {
    /**
     * Конструктор
     * @param {Object} thresholds - Объект порогов для звезд, например: { "0": 0.0, "1": 0.2, "2": 0.4, "3": 0.6, "4": 0.8, "5": 0.95 }
     */
    constructor(thresholds) {
        if (!thresholds || typeof thresholds !== 'object') {
            throw new Error('StarRatingPolicy: thresholds must be a valid object');
        }
        this.thresholds = thresholds;
        
        // Валидация структуры порогов
        for (let stars = 0; stars <= 5; stars++) {
            const key = stars.toString();
            if (!(key in this.thresholds)) {
                throw new Error(`StarRatingPolicy: missing threshold for ${stars} stars`);
            }
            if (typeof this.thresholds[key] !== 'number') {
                throw new Error(`StarRatingPolicy: threshold for ${stars} stars must be a number`);
            }
        }
    }

    /**
     * Вычисляет количество звезд на основе score
     * @param {number} score - Стилевой score от 0.0 до 1.0
     * @returns {number} Количество звезд (0-5)
     */
    calculateStars(score) {
        if (typeof score !== 'number' || isNaN(score)) {
            throw new Error('StarRatingPolicy: score must be a valid number');
        }

        // Ограничиваем score диапазоном [0, 1]
        const clampedScore = Math.max(0, Math.min(1, score));

        // Проверяем от 5 звезд до 0
        for (let stars = 5; stars >= 0; stars--) {
            const threshold = this.thresholds[stars.toString()];
            if (clampedScore >= threshold) {
                return stars;
            }
        }

        return 0;
    }

    /**
     * Полный расчет результата рейтинга
     * @param {number} score 
     * @returns {{stars: number, score: number, nextThreshold: number|null}}
     */
    evaluate(score) {
        const stars = this.calculateStars(score);
        const nextStar = stars < 5 ? stars + 1 : null;
        const nextThreshold = nextStar !== null ? this.thresholds[nextStar.toString()] : null;

        return {
            stars,
            score,
            nextThreshold
        };
    }
}

/**
 * Factory method для создания политики с параметрами по умолчанию из конфига
 */
export function createDefaultStarRatingPolicy() {
    const params = getScoringParameters();
    return new StarRatingPolicy(params.starRatingThresholds);
}
