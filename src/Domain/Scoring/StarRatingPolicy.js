import { getScoringParameters } from './scoringParameters.js';

export class StarRatingPolicy {
  constructor(thresholds, { epsilon = 0 } = {}) {
    if (!thresholds || typeof thresholds !== 'object') {
      throw new Error('StarRatingPolicy: thresholds must be a valid object');
    }
    if (typeof epsilon !== 'number' || !Number.isFinite(epsilon) || epsilon < 0 || epsilon > 0.01) {
      throw new Error('StarRatingPolicy: epsilon must be between 0 and 0.01');
    }
    this.thresholds = { ...thresholds };
    this.epsilon = epsilon;
    for (const stars of ['0', '1', '2', '3', '4', '5']) {
      if (!(stars in this.thresholds)) {
        throw new Error(`StarRatingPolicy: missing threshold for ${stars} stars`);
      }
      if (typeof this.thresholds[stars] !== 'number') {
        throw new Error(`StarRatingPolicy: threshold for ${stars} stars must be a number`);
      }
    }
  }

  calculateStars(score) {
    if (typeof score !== 'number' || Number.isNaN(score)) {
      throw new Error('StarRatingPolicy: score must be a valid number');
    }
    const clampedScore = Math.max(0, Math.min(1, score));
    if (clampedScore <= 0) return 0;

    for (let stars = 5; stars >= 1; stars -= 1) {
      if (clampedScore + this.epsilon >= this.thresholds[String(stars)]) return stars;
    }
    return 1;
  }

  evaluate(score) {
    const stars = this.calculateStars(score);
    const nextStar = stars < 5 ? Math.max(2, stars + 1) : null;
    return {
      stars,
      score,
      nextThreshold: nextStar === null ? null : this.thresholds[String(nextStar)]
    };
  }
}

export function createDefaultStarRatingPolicy() {
  return new StarRatingPolicy(getScoringParameters().starRatingThresholds);
}
