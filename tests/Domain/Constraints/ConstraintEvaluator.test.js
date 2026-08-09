import { describe, it, expect } from 'vitest';
import { ConstraintEvaluator } from '../../../src/Domain/Constraints/ConstraintEvaluator.js';
import { LinearConstraint } from '../../../src/Domain/Constraints/LinearConstraint.js';

describe('ConstraintEvaluator', () => {
  it('should evaluate a satisfied gte constraint', () => {
    const constraint = new LinearConstraint('wood_share', 'gte', 0.5);
    const evaluator = new ConstraintEvaluator();
    
    const result = evaluator.evaluate(constraint, 0.7);
    
    expect(result.isSatisfied).toBe(true);
    expect(result.violation).toBe(0);
    expect(result.constraint).toBe(constraint);
  });

  it('should evaluate a violated gte constraint', () => {
    const constraint = new LinearConstraint('wood_share', 'gte', 0.5);
    const evaluator = new ConstraintEvaluator();
    
    const result = evaluator.evaluate(constraint, 0.3);
    
    expect(result.isSatisfied).toBe(false);
    expect(result.violation).toBe(0.2);
    expect(result.constraint).toBe(constraint);
  });

  it('should evaluate a satisfied lte constraint', () => {
    const constraint = new LinearConstraint('plastic_share', 'lte', 0.1);
    const evaluator = new ConstraintEvaluator();
    
    const result = evaluator.evaluate(constraint, 0.05);
    
    expect(result.isSatisfied).toBe(true);
    expect(result.violation).toBe(0);
  });

  it('should evaluate a violated lte constraint', () => {
    const constraint = new LinearConstraint('plastic_share', 'lte', 0.1);
    const evaluator = new ConstraintEvaluator();
    
    const result = evaluator.evaluate(constraint, 0.25);
    
    expect(result.isSatisfied).toBe(false);
    expect(result.violation).toBe(0.15);
  });

  it('should handle boundary value (exactly at threshold)', () => {
    const constraint = new LinearConstraint('wood_share', 'gte', 0.5);
    const evaluator = new ConstraintEvaluator();
    
    const result = evaluator.evaluate(constraint, 0.5);
    
    expect(result.isSatisfied).toBe(true);
    expect(result.violation).toBe(0);
  });

  it('should evaluate multiple constraints and return all results', () => {
    const constraints = [
      new LinearConstraint('wood_share', 'gte', 0.5),
      new LinearConstraint('plastic_share', 'lte', 0.1),
      new LinearConstraint('form_simplicity', 'gte', 0.6)
    ];
    const evaluator = new ConstraintEvaluator();
    const values = {
      wood_share: 0.7,
      plastic_share: 0.15,
      form_simplicity: 0.5
    };
    
    const results = evaluator.evaluateAll(constraints, values);
    
    expect(results).toHaveLength(3);
    expect(results[0].isSatisfied).toBe(true);
    expect(results[1].isSatisfied).toBe(false);
    expect(results[1].violation).toBeCloseTo(0.05);
    expect(results[2].isSatisfied).toBe(false);
    expect(results[2].violation).toBeCloseTo(0.1);
  });
});
