/**
 * FeatureVector - Value Object representing item features in normalized [0, 1] range.
 * 
 * Immutable value object. All operations return new instances.
 * 
 * Features (8 dimensions):
 * - woodShare: доля деревянных текстур
 * - metalShare: доля металлических текстур
 * - glassShare: доля стеклянных поверхностей
 * - lightColorShare: доля светлых цветов
 * - warmPaletteShare: доля теплой палитры
 * - formSimplicity: простота форм (1 = простые, 0 = сложные)
 * - textureComplexity: сложность текстур
 * - plasticShare: доля пластика
 */
export class FeatureVector {
  static REQUIRED_FEATURES = [
    'woodShare',
    'metalShare',
    'glassShare',
    'lightColorShare',
    'warmPaletteShare',
    'formSimplicity',
    'textureComplexity',
    'plasticShare'
  ];

  constructor(data, skipValidation = false) {
    // Validate required features
    for (const feature of FeatureVector.REQUIRED_FEATURES) {
      if (!(feature in data)) {
        throw new Error(`Missing required feature: ${feature}`);
      }
    }

    // Validate and assign each feature
    for (const feature of FeatureVector.REQUIRED_FEATURES) {
      const value = data[feature];
      
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Feature ${feature} must be a finite number`);
      }
      
      // Skip range validation for intermediate calculations (add, multiply)
      if (!skipValidation && (value < 0 || value > 1)) {
        throw new Error('Feature value out of range [0, 1]');
      }
      
      // Use Object.defineProperty to ensure immutability at property level
      Object.defineProperty(this, feature, {
        value: value,
        writable: false,
        enumerable: true,
        configurable: false
      });
    }

    // Freeze the instance for complete immutability
    Object.freeze(this);
  }

  /**
   * Adds another vector to this one, returning a new FeatureVector.
   * @param {FeatureVector} other 
   * @returns {FeatureVector}
   */
  add(other) {
    if (!(other instanceof FeatureVector)) {
      throw new Error('Can only add FeatureVector instances');
    }

    const newData = {};
    for (const feature of FeatureVector.REQUIRED_FEATURES) {
      newData[feature] = this[feature] + other[feature];
    }

    // Skip validation because sum can exceed [0, 1] range during intermediate calculations
    return new FeatureVector(newData, true);
  }

  /**
   * Multiplies all features by a scalar, returning a new FeatureVector.
   * @param {number} scalar 
   * @returns {FeatureVector}
   */
  multiply(scalar) {
    if (typeof scalar !== 'number' || !Number.isFinite(scalar)) {
      throw new Error('Scalar must be a finite number');
    }

    const newData = {};
    for (const feature of FeatureVector.REQUIRED_FEATURES) {
      newData[feature] = this[feature] * scalar;
    }

    // Skip validation because multiplication can exceed [0, 1] range during intermediate calculations
    return new FeatureVector(newData, true);
  }

  /**
   * Calculates the average of multiple vectors.
   * @param {FeatureVector[]} vectors 
   * @returns {FeatureVector}
   */
  static average(vectors) {
    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new Error('Cannot calculate average of empty list');
    }

    // Sum all vectors
    let sum = vectors[0];
    for (let i = 1; i < vectors.length; i++) {
      sum = sum.add(vectors[i]);
    }

    // Divide by count
    const count = vectors.length;
    const avgData = {};
    for (const feature of FeatureVector.REQUIRED_FEATURES) {
      avgData[feature] = sum[feature] / count;
    }

    return new FeatureVector(avgData);
  }

  /**
   * Returns a plain object representation.
   * @returns {Object}
   */
  toObject() {
    const obj = {};
    for (const feature of FeatureVector.REQUIRED_FEATURES) {
      obj[feature] = this[feature];
    }
    return obj;
  }
}
