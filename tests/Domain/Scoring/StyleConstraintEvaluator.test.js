import { describe, it, expect } from 'vitest';
import { StyleConstraintEvaluator } from '../../../src/Domain/Scoring/StyleConstraintEvaluator.js';
import { Violation } from '../../../src/Domain/Scoring/Violation.js';

describe('StyleConstraintEvaluator', () => {
    const sampleConstraints = [
        { id: 'wood-min', feature: 'wood_share', operator: '>=', threshold: 0.6 },
        { id: 'simple-forms', feature: 'form_simplicity', operator: '<=', threshold: 0.4 },
        { id: 'low-saturation', feature: 'saturation', operator: '<=', threshold: 0.5 }
    ];

    describe('constructor validation', () => {
        it('should create evaluator with valid constraints', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            expect(evaluator.constraints).toHaveLength(3);
        });

        it('should throw error for non-array constraints', () => {
            expect(() => new StyleConstraintEvaluator('not-an-array'))
                .toThrow('Constraints must be an array');
        });

        it('should freeze constraints array', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            expect(() => {
                evaluator.constraints.push({ id: 'new' });
            }).toThrow();
        });
    });

    describe('evaluate method', () => {
        it('should return empty array when all constraints are satisfied', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = {
                wood_share: 0.8,
                form_simplicity: 0.2,
                saturation: 0.3
            };

            const violations = evaluator.evaluate(roomVector);
            expect(violations).toHaveLength(0);
        });

        it('should return violations for unsatisfied constraints', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = {
                wood_share: 0.3,  // Violates >= 0.6
                form_simplicity: 0.8,  // Violates <= 0.4
                saturation: 0.3  // Satisfied
            };

            const violations = evaluator.evaluate(roomVector);
            expect(violations).toHaveLength(2);
            expect(violations.map(v => v.constraintId)).toContain('wood-min');
            expect(violations.map(v => v.constraintId)).toContain('simple-forms');
        });

        it('should skip constraints for features not in room vector', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = {
                wood_share: 0.8
                // form_simplicity and saturation missing
            };

            const violations = evaluator.evaluate(roomVector);
            // Only wood constraint should be checked (and satisfied)
            expect(violations).toHaveLength(0);
        });

        it('should throw error for invalid room vector', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            
            expect(() => evaluator.evaluate(null))
                .toThrow('Room vector must be a valid object');
            expect(() => evaluator.evaluate('string'))
                .toThrow('Room vector must be a valid object');
        });

        it('should return frozen violations array', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = { wood_share: 0.3 };

            const violations = evaluator.evaluate(roomVector);
            expect(() => violations.push(null)).toThrow();
        });
    });

    describe('isSatisfied method', () => {
        it('should return true when all constraints are satisfied', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = {
                wood_share: 0.8,
                form_simplicity: 0.2,
                saturation: 0.3
            };

            expect(evaluator.isSatisfied(roomVector)).toBe(true);
        });

        it('should return false when any constraint is violated', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = {
                wood_share: 0.3,
                form_simplicity: 0.2,
                saturation: 0.3
            };

            expect(evaluator.isSatisfied(roomVector)).toBe(false);
        });
    });

    describe('getSummary method', () => {
        it('should return correct summary for perfect match', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = {
                wood_share: 0.8,
                form_simplicity: 0.2,
                saturation: 0.3
            };

            const summary = evaluator.getSummary(roomVector);
            expect(summary.total).toBe(3);
            expect(summary.satisfied).toBe(3);
            expect(summary.violated).toBe(0);
            expect(summary.isPerfect).toBe(true);
        });

        it('should return correct summary for partial match', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = {
                wood_share: 0.3,  // Violated
                form_simplicity: 0.2,  // Satisfied
                saturation: 0.3  // Satisfied
            };

            const summary = evaluator.getSummary(roomVector);
            expect(summary.total).toBe(3);
            expect(summary.satisfied).toBe(2);
            expect(summary.violated).toBe(1);
            expect(summary.isPerfect).toBe(false);
        });

        it('should return frozen summary object', () => {
            const evaluator = new StyleConstraintEvaluator(sampleConstraints);
            const roomVector = { wood_share: 0.8, form_simplicity: 0.2, saturation: 0.3 };

            const summary = evaluator.getSummary(roomVector);
            expect(() => { summary.total = 99; }).toThrow();
        });
    });
});
