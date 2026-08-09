/**
 * scoringParameters.js
 *
 * Domain configuration: Параметры системы оценки.
 * Загружает данные из data/scoring/scoring-parameters.json через Infrastructure.
 * 
 * В Domain слое это абстракция - реальная загрузка происходит в Infrastructure.
 */

let _scoringParameters = null;

/**
 * Инициализация параметров оценки
 * @param {Object} params - Объект параметров из JSON
 */
export function initializeScoringParameters(params) {
    if (!params || typeof params !== 'object') {
        throw new Error('scoringParameters: params must be a valid object');
    }
    
    // Валидация обязательных полей
    if (!params.starRatingThresholds || typeof params.starRatingThresholds !== 'object') {
        throw new Error('scoringParameters: missing starRatingThresholds');
    }
    
    if (typeof params.maxPenalty !== 'number' || params.maxPenalty <= 0) {
        throw new Error('scoringParameters: maxPenalty must be a positive number');
    }
    
    if (typeof params.styleWeight !== 'number' || params.styleWeight < 0) {
        throw new Error('scoringParameters: styleWeight must be a non-negative number');
    }
    
    _scoringParameters = Object.freeze({
        starRatingThresholds: Object.freeze(params.starRatingThresholds),
        maxPenalty: params.maxPenalty,
        styleWeight: params.styleWeight,
        ergonomicsWeight: params.ergonomicsWeight || 0,
        defaultWeight: params.defaultWeight || 1.0
    });
}

/**
 * Получение текущих параметров
 * @returns {Object} Замороженный объект параметров
 */
export function getScoringParameters() {
    if (!_scoringParameters) {
        throw new Error('scoringParameters: not initialized. Call initializeScoringParameters first.');
    }
    return _scoringParameters;
}

/**
 * Сброс параметров (для тестов)
 */
export function resetScoringParameters() {
    _scoringParameters = null;
}
