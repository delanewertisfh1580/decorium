import { describe, it, expect } from 'vitest';
import { Violation } from '../../../src/Domain/Scoring/Violation.js';

describe('Violation', () => {
    describe('constructor validation', () => {
        it('should create a valid violation with correct parameters', () => {
            const violation = new Violation(
                'wood-min',
                'wood_share',
                0.6,
                0.3,
                0.5
            );

            expect(violation.constraintId).toBe('wood-min');
            expect(violation.featureName).toBe('wood_share');
            expect(violation.expectedValue).toBe(0.6);
            expect(violation.actualValue).toBe(0.3);
            expect(violation.severity).toBe(0.5);
        });

        it('should throw error for empty constraintId', () => {
            expect(() => new Violation('', 'feature', 0.5, 0.3, 0.2))
                .toThrow('Constraint ID must be a non-empty string');
        });

        it('should throw error for invalid severity (negative)', () => {
            expect(() => new Violation('c1', 'feature', 0.5, 0.3, -0.1))
                .toThrow('Severity must be a number between 0 and 1');
        });

        it('should throw error for invalid severity (> 1)', () => {
            expect(() => new Violation('c1', 'feature', 0.5, 0.3, 1.5))
                .toThrow('Severity must be a number between 0 and 1');
        });

        it('should be immutable', () => {
            const violation = new Violation('c1', 'feature', 0.5, 0.3, 0.4);
            
            expect(() => {
                violation.severity = 0.9;
            }).toThrow();

            expect(violation.severity).toBe(0.4);
        });
    });

    describe('fromConstraint static method', () => {
        it('should return null when constraint is satisfied (>=)', () => {
            const constraint = {
                id: 'wood-min',
                feature: 'wood_share',
                operator: '>=',
                threshold: 0.6
            };

            const result = Violation.fromConstraint(constraint, 0.7);
            expect(result).toBeNull();
        });

        it('should create violation when constraint is violated (>=)', () => {
            const constraint = {
                id: 'wood-min',
                feature: 'wood_share',
                operator: '>=',
                threshold: 0.6
            };

            const result = Violation.fromConstraint(constraint, 0.3);
            
            expect(result).not.toBeNull();
            expect(result.constraintId).toBe('wood-min');
            expect(result.featureName).toBe('wood_share');
            expect(result.expectedValue).toBe(0.6);
            expect(result.actualValue).toBe(0.3);
            expect(result.severity).toBeGreaterThan(0);
        });

        it('should return null when constraint is satisfied (<=)', () => {
            const constraint = {
                id: 'complexity-max',
                feature: 'form_simplicity',
                operator: '<=',
                threshold: 0.4
            };

            const result = Violation.fromConstraint(constraint, 0.3);
            expect(result).toBeNull();
        });

        it('should create violation when constraint is violated (<=)', () => {
            const constraint = {
                id: 'complexity-max',
                feature: 'form_simplicity',
                operator: '<=',
                threshold: 0.4
            };

            const result = Violation.fromConstraint(constraint, 0.8);
            
            expect(result).not.toBeNull();
            expect(result.constraintId).toBe('complexity-max');
            expect(result.featureName).toBe('form_simplicity');
            expect(result.expectedValue).toBe(0.4);
            expect(result.actualValue).toBe(0.8);
        });

        it('should calculate severity correctly for >= violation', () => {
            const constraint = {
                id: 'wood-min',
                feature: 'wood_share',
                operator: '>=',
                threshold: 0.6
            };

            // actual = 0.3, threshold = 0.6, diff = 0.3
            // severity = min(1, 0.3 / 0.6) = 0.5
            const result = Violation.fromConstraint(constraint, 0.3);
            expect(result.severity).toBeCloseTo(0.5, 2);
        });

        it('should cap severity at 1.0', () => {
            const constraint = {
                id: 'wood-min',
                feature: 'wood_share',
                operator: '>=',
                threshold: 0.6
            };

            // actual = 0.0, threshold = 0.6, diff = 0.6
            // severity = min(1, 0.6 / 0.6) = 1.0
            const result = Violation.fromConstraint(constraint, 0.0);
            expect(result.severity).toBe(1.0);
        });
    });
});
