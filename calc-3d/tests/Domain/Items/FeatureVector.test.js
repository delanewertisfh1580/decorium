import { describe, it, expect } from 'vitest';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';

describe('FeatureVector (Domain)', () => {
  const validData = {
    woodShare: 0.8,
    metalShare: 0.1,
    glassShare: 0.1,
    lightColorShare: 0.9,
    warmPaletteShare: 0.7,
    formSimplicity: 0.8,
    textureComplexity: 0.2,
    plasticShare: 0.0
  };

  describe('Construction & Validation', () => {
    it('should create a valid vector with correct data', () => {
      const vector = new FeatureVector(validData);
      expect(vector.woodShare).toBe(0.8);
      expect(vector.plasticShare).toBe(0.0);
    });

    it('should throw error if value is less than 0', () => {
      const invalidData = { ...validData, woodShare: -0.1 };
      expect(() => new FeatureVector(invalidData)).toThrow('Feature value out of range [0, 1]');
    });

    it('should throw error if value is greater than 1', () => {
      const invalidData = { ...validData, metalShare: 1.5 };
      expect(() => new FeatureVector(invalidData)).toThrow('Feature value out of range [0, 1]');
    });

    it('should throw error if required feature is missing', () => {
      const invalidData = { woodShare: 0.5 }; // missing others
      expect(() => new FeatureVector(invalidData)).toThrow('Missing required feature');
    });
  });

  describe('Operations', () => {
    it('should add two vectors correctly', () => {
      const v1 = new FeatureVector(validData);
      const v2 = new FeatureVector({
        ...validData,
        woodShare: 0.2, // 0.8 + 0.2 = 1.0
        metalShare: 0.0 // 0.1 + 0.0 = 0.1
      });

      const result = v1.add(v2);

      // Result should be a new instance
      expect(result).not.toBe(v1);
      expect(result.woodShare).toBe(1.0);
      expect(result.metalShare).toBe(0.1);
    });

    it('should multiply vector by scalar correctly', () => {
      const v1 = new FeatureVector(validData);
      const result = v1.multiply(0.5);

      expect(result.woodShare).toBe(0.4); // 0.8 * 0.5
      expect(result.warmPaletteShare).toBe(0.35); // 0.7 * 0.5
    });

    it('should calculate average of multiple vectors', () => {
      const v1 = new FeatureVector({ ...validData, woodShare: 1.0 });
      const v2 = new FeatureVector({ ...validData, woodShare: 0.0 });
      const v3 = new FeatureVector({ ...validData, woodShare: 0.5 });

      const average = FeatureVector.average([v1, v2, v3]);

      expect(average.woodShare).toBeCloseTo(0.5, 5); // (1+0+0.5)/3 = 0.5
      expect(average.metalShare).toBeCloseTo(0.1, 5); // (0.1+0.1+0.1)/3 = 0.1
    });

    it('should throw error if averaging empty list', () => {
      expect(() => FeatureVector.average([])).toThrow('Cannot calculate average of empty list');
    });
  });

  describe('Immutability', () => {
    it('should not mutate original vector on add', () => {
      const v1 = new FeatureVector(validData);
      const initialWood = v1.woodShare;
      
      v1.add(new FeatureVector(validData));
      
      expect(v1.woodShare).toBe(initialWood);
    });

    it('should not mutate original vector on multiply', () => {
      const v1 = new FeatureVector(validData);
      const initialWood = v1.woodShare;
      
      v1.multiply(2);
      
      expect(v1.woodShare).toBe(initialWood);
    });
  });
});
