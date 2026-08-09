/**
 * ViewModel для результатов оценки комнаты.
 * Отображает счет, звезды и фидбек.
 * 
 * @class EvaluationViewModel
 */
export class EvaluationViewModel {
    constructor() {
        this._score = 0;
        this._maxScore = 0;
        this._stars = 0;
        this._feedback = [];
        this._isVisible = false;
    }

    get score() { return this._score; }
    get maxScore() { return this._maxScore; }
    get stars() { return this._stars; }
    get feedback() { return this._feedback; }
    get isVisible() { return this._isVisible; }

    /**
     * Обновляет данные оценки
     * @param {number} score 
     * @param {number} maxScore 
     * @param {number} stars 
     * @param {string[]} feedback 
     */
    update(score, maxScore, stars, feedback) {
        this._score = score;
        this._maxScore = maxScore;
        this._stars = stars;
        this._feedback = feedback;
        this._isVisible = true;
    }

    hide() {
        this._isVisible = false;
    }

    reset() {
        this._score = 0;
        this._maxScore = 0;
        this._stars = 0;
        this._feedback = [];
        this._isVisible = false;
    }
}
