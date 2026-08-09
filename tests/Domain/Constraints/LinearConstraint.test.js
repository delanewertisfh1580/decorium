import { describe, it, expect } from 'vitest';
import { LinearConstraint } from '../../../src/Domain/Constraints/LinearConstraint.js';

describe('LinearConstraint', () => {
  it('should create a valid constraint with gte operator', () => {
    const constraint = new LinearConstraint('wood_share', 'gte', 0.5);
    
    expect(constraint.featureKey).toBe('wood_share');
    expect(constraint.operator).toBe('gte');
    expect(constraint.threshold).toBe(0.5);
  });

  it('should create a valid constraint with lte operator', () => {
    const constraint = new LinearConstraint('plastic_share', 'lte', 0.1);
    
    expect(constraint.featureKey).toBe('plastic_share');
    expect(constraint.operator).toBe('lte');
    expect(constraint.threshold).toBe(0.1);
  });

  it('should throw error for invalid operator', () => {
    expect(() => new LinearConstraint('test', 'invalid', 0.5)).toThrow('Invalid operator');
  });

  it('should throw error for missing feature key', () => {
    expect(() => new LinearConstraint('', 'gte', 0.5)).toThrow('Feature key is required');
  });

  it('should throw error for non-number threshold', () => {
    expect(() => new LinearConstraint('test', 'gte', 'not-a-number')).toThrow('Threshold must be a number');
  });
});
