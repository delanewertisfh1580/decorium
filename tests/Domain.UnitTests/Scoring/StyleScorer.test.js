import { describe, it, expect } from 'vitest';
import { StyleScorer } from '../../../src/Domain/Scoring/StyleScorer.js';
import { Violation } from '../../../src/Domain/Constraints/Violation.js';
import { LinearConstraint } from '../../../src/Domain/Constraints/LinearConstraint.js';

describe('StyleScorer', () => {
  let scorer;
  let scoringParams;

  beforeEach(() => {
    scoringParams = {
      defaultWeight: 1.0,
      maxPenalty: 1.0,
    };
    scorer = new StyleScorer(scoringParams);
  });

  describe('calculatePenalty', () => {
    it('should return 0 penalty for no violations', () => {
      const violations = [];
      const penalty = scorer.calculatePenalty(violations);
      expect(penalty).toBe(0);
    });

    it('should calculate penalty for single violation with default weight', () => {
      const constraint = new LinearConstraint('wood_share', 'gte', 0.6);
      const violation = Violation.fromConstraint(constraint, 0.4); // actual 0.4, target 0.6, diff 0.2
      const violations = [violation];
      
      const penalty = scorer.calculatePenalty(violations);
      
      // severity = 0.2, weight = 1.0 -> penalty = 0.2
      expect(penalty).toBeCloseTo(0.2, 5);
    });

    it('should sum penalties for multiple violations', () => {
      const constraint1 = new LinearConstraint('wood_share', 'gte', 0.6);
      const violation1 = Violation.fromConstraint(constraint1, 0.4); // severity 0.2
      
      const constraint2 = new LinearConstraint('form_simplicity', 'lte', 0.4);
      const violation2 = Violation.fromConstraint(constraint2, 0.7); // severity 0.3
      
      const violations = [violation1, violation2];
      
      const penalty = scorer.calculatePenalty(violations);
      
      expect(penalty).toBeCloseTo(0.5, 5); // 0.2 + 0.3
    });

    it('should cap penalty at maxPenalty', () => {
      const constraint = new LinearConstraint('wood_share', 'gte', 0.9);
      const violation = Violation.fromConstraint(constraint, 0.0); // severity 0.9
      
      // Create multiple violations to exceed maxPenalty
      const violations = [violation, violation, violation]; // total 2.7
      
      const penalty = scorer.calculatePenalty(violations);
      
      expect(penalty).toBe(1.0); // capped at maxPenalty
    });
  });

  describe('calculateScore', () => {
    it('should return 1.0 score for zero penalty', () => {
      const score = scorer.calculateScore(0);
      expect(score).toBe(1.0);
    });

    it('should return 0.0 score for penalty >= 1.0', () => {
      const score = scorer.calculateScore(1.0);
      expect(score).toBe(0.0);
    });

    it('should calculate score as 1 - penalty', () => {
      const score = scorer.calculateScore(0.3);
      expect(score).toBeCloseTo(0.7, 5);
    });

    it('should never return negative score', () => {
      const score = scorer.calculateScore(1.5); // penalty > 1
      expect(score).toBe(0.0);
    });
  });

  describe('evaluate', () => {
    it('should return perfect score for no violations', () => {
      const violations = [];
      const result = scorer.evaluate(violations);
      
      expect(result.penalty).toBe(0);
      expect(result.score).toBe(1.0);
    });

    it('should return calculated score for violations', () => {
      const constraint = new LinearConstraint('wood_share', 'gte', 0.6);
      const violation = Violation.fromConstraint(constraint, 0.4); // severity 0.2
      const violations = [violation];
      
      const result = scorer.evaluate(violations);
      
      expect(result.penalty).toBeCloseTo(0.2, 5);
      expect(result.score).toBeCloseTo(0.8, 5);
    });

    it('should include violations in result', () => {
      const constraint = new LinearConstraint('wood_share', 'gte', 0.6);
      const violation = Violation.fromConstraint(constraint, 0.4);
      const violations = [violation];
      
      const result = scorer.evaluate(violations);
      
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toBe(violation);
    });
  });
});
