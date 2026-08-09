import { describe, it, expect, beforeEach } from 'vitest';
import { StarRatingPolicy, createDefaultStarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';
import { initializeScoringParameters, resetScoringParameters } from '../../../src/Domain/Scoring/scoringParameters.js';

describe('StarRatingPolicy', () => {
    const defaultThresholds = {
        "0": 0.0,
        "1": 0.2,
        "2": 0.4,
        "3": 0.6,
        "4": 0.8,
        "5": 0.95
    };

    beforeEach(() => {
        resetScoringParameters();
    });

    describe('Constructor validation', () => {
        it('should throw error for null thresholds', () => {
            expect(() => new StarRatingPolicy(null)).toThrow('thresholds must be a valid object');
        });

        it('should throw error for non-object thresholds', () => {
            expect(() => new StarRatingPolicy("invalid")).toThrow('thresholds must be a valid object');
        });

        it('should throw error for missing threshold keys', () => {
            const incomplete = { "0": 0.0, "1": 0.2 }; // missing 2-5
            expect(() => new StarRatingPolicy(incomplete)).toThrow('missing threshold for 2 stars');
        });

        it('should throw error for non-number threshold values', () => {
            const invalid = { ...defaultThresholds, "3": "invalid" };
            expect(() => new StarRatingPolicy(invalid)).toThrow('threshold for 3 stars must be a number');
        });

        it('should create policy with valid thresholds', () => {
            const policy = new StarRatingPolicy(defaultThresholds);
            expect(policy).toBeDefined();
            expect(policy.thresholds).toEqual(defaultThresholds);
        });
    });

    describe('calculateStars', () => {
        const policy = new StarRatingPolicy(defaultThresholds);

        it('should throw error for non-number score', () => {
            expect(() => policy.calculateStars("invalid")).toThrow('score must be a valid number');
        });

        it('should throw error for NaN score', () => {
            expect(() => policy.calculateStars(NaN)).toThrow('score must be a valid number');
        });

        it('should return 0 stars for score 0.0', () => {
            expect(policy.calculateStars(0.0)).toBe(0);
        });

        it('should return 1 star for score 0.2', () => {
            expect(policy.calculateStars(0.2)).toBe(1);
        });

        it('should return 2 stars for score 0.4', () => {
            expect(policy.calculateStars(0.4)).toBe(2);
        });

        it('should return 3 stars for score 0.6', () => {
            expect(policy.calculateStars(0.6)).toBe(3);
        });

        it('should return 4 stars for score 0.8', () => {
            expect(policy.calculateStars(0.8)).toBe(4);
        });

        it('should return 5 stars for score 0.95', () => {
            expect(policy.calculateStars(0.95)).toBe(5);
        });

        it('should return 5 stars for score 1.0', () => {
            expect(policy.calculateStars(1.0)).toBe(5);
        });

        it('should return 0 stars for score between 0.0 and 0.2', () => {
            expect(policy.calculateStars(0.1)).toBe(0);
        });

        it('should return 1 star for score between 0.2 and 0.4', () => {
            expect(policy.calculateStars(0.3)).toBe(1);
        });

        it('should clamp score below 0 to 0', () => {
            expect(policy.calculateStars(-0.5)).toBe(0);
        });

        it('should clamp score above 1 to 1 (5 stars)', () => {
            expect(policy.calculateStars(1.5)).toBe(5);
        });

        it('should return 5 stars for score 0.99', () => {
            expect(policy.calculateStars(0.99)).toBe(5);
        });

        it('should return 4 stars for score 0.94 (just below 5-star threshold)', () => {
            expect(policy.calculateStars(0.94)).toBe(4);
        });
    });

    describe('evaluate', () => {
        const policy = new StarRatingPolicy(defaultThresholds);

        it('should return full result object for score 0.0', () => {
            const result = policy.evaluate(0.0);
            expect(result).toEqual({
                stars: 0,
                score: 0.0,
                nextThreshold: 0.2
            });
        });

        it('should return full result object for score 0.5 (2 stars)', () => {
            const result = policy.evaluate(0.5);
            expect(result).toEqual({
                stars: 2,
                score: 0.5,
                nextThreshold: 0.6
            });
        });

        it('should return full result object for score 0.95 (5 stars, no next)', () => {
            const result = policy.evaluate(0.95);
            expect(result).toEqual({
                stars: 5,
                score: 0.95,
                nextThreshold: null
            });
        });

        it('should return full result object for score 1.0 (5 stars)', () => {
            const result = policy.evaluate(1.0);
            expect(result).toEqual({
                stars: 5,
                score: 1.0,
                nextThreshold: null
            });
        });
    });

    describe('Edge cases', () => {
        const customThresholds = {
            "0": 0.0,
            "1": 0.5,
            "2": 0.6,
            "3": 0.7,
            "4": 0.8,
            "5": 0.9
        };
        const policy = new StarRatingPolicy(customThresholds);

        it('should work with custom thresholds', () => {
            expect(policy.calculateStars(0.4)).toBe(0);
            expect(policy.calculateStars(0.5)).toBe(1);
            expect(policy.calculateStars(0.85)).toBe(4);
            expect(policy.calculateStars(0.95)).toBe(5);
        });
    });
});

describe('createDefaultStarRatingPolicy', () => {
    beforeEach(() => {
        resetScoringParameters();
    });

    it('should throw error if parameters not initialized', () => {
        expect(() => createDefaultStarRatingPolicy()).toThrow('not initialized');
    });

    it('should create policy with initialized parameters', () => {
        const testParams = {
            starRatingThresholds: {
                "0": 0.0,
                "1": 0.2,
                "2": 0.4,
                "3": 0.6,
                "4": 0.8,
                "5": 0.95
            },
            maxPenalty: 5.0,
            styleWeight: 1.0
        };
        initializeScoringParameters(testParams);
        
        const policy = createDefaultStarRatingPolicy();
        
        expect(policy).toBeDefined();
        expect(policy.calculateStars(0.5)).toBe(2);
    });
});
