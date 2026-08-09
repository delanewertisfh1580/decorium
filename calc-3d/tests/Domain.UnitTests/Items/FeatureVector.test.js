import { describe, it, expect } from 'vitest';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';

describe('FeatureVector', () => {
  const validFeatures = {
    woodShare: 0.7,
    metalShare: 0.2,
    glassShare: 0.1,
    lightColorShare: 0.8,
    warmPaletteShare: 0.6,
    formSimplicity: 0.5,
    saturationLevel: 0.3,
    plasticShare: 0.05
  };

  describe('Constructor', () => {
    it('should create instance with valid input', () => {
      const vector = new FeatureVector(validFeatures);
      expect(vector).toBeInstanceOf(FeatureVector);
    });

    it('should throw error on negative value', () => {
      const invalidFeatures = { ...validFeatures, woodShare: -0.1 };
      expect(() => new FeatureVector(invalidFeatures)).toThrow('woodShare must be between 0 and 1');
    });

    it('should throw error on value greater than 1', () => {
      const invalidFeatures = { ...validFeatures, metalShare: 1.5 };
      expect(() => new FeatureVector(invalidFeatures)).toThrow('metalShare must be between 0 and 1');
    });

    it('should throw error on missing required field', () => {
      const { woodShare, ...missingField } = validFeatures;
      expect(() => new FeatureVector(missingField)).toThrow('Missing required field: woodShare');
    });

    it('should throw error on non-number value', () => {
      const invalidFeatures = { ...validFeatures, glassShare: 'not a number' };
      expect(() => new FeatureVector(invalidFeatures)).toThrow('glassShare must be a number');
    });
  });

  describe('Immutability', () => {
    it('should have read-only properties', () => {
      const vector = new FeatureVector(validFeatures);
      
      // Attempt to modify should throw or be ignored in strict mode
      // We verify that direct assignment throws TypeError due to getter-only property
      expect(() => {
        vector.woodShare = 0.9;
      }).toThrow();
      
      // Value should remain unchanged
      expect(vector.woodShare).toBe(0.7);
    });
  });

  describe('average()', () => {
    it('should calculate correct mean vector', () => {
      const vector1 = new FeatureVector({ ...validFeatures, woodShare: 0.6 });
      const vector2 = new FeatureVector({ ...validFeatures, woodShare: 0.8 });
      
      const average = FeatureVector.average([vector1, vector2]);
      
      expect(average.woodShare).toBeCloseTo(0.7, 5);
      expect(average.metalShare).toBeCloseTo(0.2, 5);
    });

    it('should return new instance', () => {
      const vector1 = new FeatureVector(validFeatures);
      const vector2 = new FeatureVector(validFeatures);
      
      const average = FeatureVector.average([vector1, vector2]);
      
      expect(average).toBeInstanceOf(FeatureVector);
      expect(average).not.toBe(vector1);
      expect(average).not.toBe(vector2);
    });

    it('should throw error on empty array', () => {
      expect(() => FeatureVector.average([])).toThrow('Cannot calculate average of empty array');
    });

    it('should handle single vector', () => {
      const vector = new FeatureVector(validFeatures);
      const average = FeatureVector.average([vector]);
      
      expect(average.woodShare).toBeCloseTo(vector.woodShare, 5);
    });
  });

  describe('dot()', () => {
    it('should calculate scalar product', () => {
      const vector1 = new FeatureVector({ ...validFeatures, woodShare: 1.0 });
      const vector2 = new FeatureVector({ ...validFeatures, woodShare: 0.5 });
      
      // Only woodShare differs: 1.0 * 0.5 = 0.5 contribution from woodShare
      // Other fields are identical, so their contribution is value^2
      const dotProduct = vector1.dot(vector2);
      
      expect(dotProduct).toBeGreaterThan(0);
    });

    it('should return same result regardless of order', () => {
      const vector1 = new FeatureVector(validFeatures);
      const vector2 = new FeatureVector({ ...validFeatures, woodShare: 0.3 });
      
      const dot1 = vector1.dot(vector2);
      const dot2 = vector2.dot(vector1);
      
      expect(dot1).toBeCloseTo(dot2, 10);
    });
  });

  describe('toArray()', () => {
    it('should return plain object', () => {
      const vector = new FeatureVector(validFeatures);
      const array = vector.toArray();
      
      expect(typeof array).toBe('object');
      expect(array.constructor).toBe(Object);
      expect(array.woodShare).toBe(0.7);
    });

    it('should contain all features', () => {
      const vector = new FeatureVector(validFeatures);
      const array = vector.toArray();
      
      expect(array).toHaveProperty('woodShare');
      expect(array).toHaveProperty('metalShare');
      expect(array).toHaveProperty('glassShare');
      expect(array).toHaveProperty('lightColorShare');
      expect(array).toHaveProperty('warmPaletteShare');
      expect(array).toHaveProperty('formSimplicity');
      expect(array).toHaveProperty('saturationLevel');
      expect(array).toHaveProperty('plasticShare');
    });
  });

  describe('equals()', () => {
    it('should return true for equal vectors', () => {
      const vector1 = new FeatureVector(validFeatures);
      const vector2 = new FeatureVector(validFeatures);
      
      expect(vector1.equals(vector2)).toBe(true);
    });

    it('should return false for different vectors', () => {
      const vector1 = new FeatureVector(validFeatures);
      const vector2 = new FeatureVector({ ...validFeatures, woodShare: 0.9 });
      
      expect(vector1.equals(vector2)).toBe(false);
    });

    it('should return false for non-FeatureVector', () => {
      const vector = new FeatureVector(validFeatures);
      expect(vector.equals(null)).toBe(false);
      expect(vector.equals({})).toBe(false);
    });
  });
});
