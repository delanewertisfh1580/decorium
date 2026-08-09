/**
 * Value Object representing a feature vector for an item.
 * Immutable - properties cannot be changed after construction.
 * 
 * Features (all normalized to [0, 1]):
 * - woodShare: доля деревянных текстур
 * - metalShare: доля металлических текстур
 * - glassShare: доля стеклянных поверхностей
 * - lightColorShare: доля светлых цветов
 * - warmPaletteShare: доля теплой палитры
 * - formSimplicity: простота форм (0 = сложные, 1 = простые)
 * - saturationLevel: уровень насыщенности цветов
 * - plasticShare: доля пластиковых элементов
 */
export class FeatureVector {
  #woodShare;
  #metalShare;
  #glassShare;
  #lightColorShare;
  #warmPaletteShare;
  #formSimplicity;
  #saturationLevel;
  #plasticShare;

  static REQUIRED_FIELDS = [
    'woodShare',
    'metalShare',
    'glassShare',
    'lightColorShare',
    'warmPaletteShare',
    'formSimplicity',
    'saturationLevel',
    'plasticShare'
  ];

  /**
   * @param {Object} features - Object containing feature values
   * @throws {Error} If any feature is missing or out of range [0, 1]
   */
  constructor(features) {
    if (!features || typeof features !== 'object') {
      throw new Error('Features must be an object');
    }

    // Validate and assign each required field
    for (const field of FeatureVector.REQUIRED_FIELDS) {
      if (!(field in features)) {
        throw new Error(`Missing required field: ${field}`);
      }

      const value = features[field];
      
      if (typeof value !== 'number') {
        throw new Error(`${field} must be a number`);
      }

      if (value < 0 || value > 1) {
        throw new Error(`${field} must be between 0 and 1`);
      }

      // Store in private field for immutability using direct syntax
      if (field === 'woodShare') this.#woodShare = value;
      else if (field === 'metalShare') this.#metalShare = value;
      else if (field === 'glassShare') this.#glassShare = value;
      else if (field === 'lightColorShare') this.#lightColorShare = value;
      else if (field === 'warmPaletteShare') this.#warmPaletteShare = value;
      else if (field === 'formSimplicity') this.#formSimplicity = value;
      else if (field === 'saturationLevel') this.#saturationLevel = value;
      else if (field === 'plasticShare') this.#plasticShare = value;
    }
  }

  // Public getters for read-only access - using explicit private field access
  get woodShare() { return this.#woodShare; }
  get metalShare() { return this.#metalShare; }
  get glassShare() { return this.#glassShare; }
  get lightColorShare() { return this.#lightColorShare; }
  get warmPaletteShare() { return this.#warmPaletteShare; }
  get formSimplicity() { return this.#formSimplicity; }
  get saturationLevel() { return this.#saturationLevel; }
  get plasticShare() { return this.#plasticShare; }

  /**
   * Access field value by name (used by average and other methods)
   * @param {string} field - Field name
   * @returns {number} Field value
   */
  getField(field) {
    if (!FeatureVector.REQUIRED_FIELDS.includes(field)) {
      throw new Error(`Unknown field: ${field}`);
    }
    // Access via getter using bracket notation on this
    return this[field];
  }

  /**
   * Calculate average vector from array of vectors
   * @param {FeatureVector[]} vectors - Array of FeatureVectors
   * @returns {FeatureVector} New averaged FeatureVector
   * @throws {Error} If array is empty
   */
  static average(vectors) {
    if (!vectors || vectors.length === 0) {
      throw new Error('Cannot calculate average of empty array');
    }

    const sum = {};
    for (const field of FeatureVector.REQUIRED_FIELDS) {
      sum[field] = 0;
    }

    for (const vector of vectors) {
      if (!(vector instanceof FeatureVector)) {
        throw new Error('All items must be FeatureVector instances');
      }
      for (const field of FeatureVector.REQUIRED_FIELDS) {
        sum[field] += vector.getField(field);
      }
    }

    const average = {};
    for (const field of FeatureVector.REQUIRED_FIELDS) {
      average[field] = sum[field] / vectors.length;
    }

    return new FeatureVector(average);
  }

  /**
   * Calculate dot product with another vector
   * @param {FeatureVector} other - Another FeatureVector
   * @returns {number} Scalar product
   */
  dot(other) {
    if (!(other instanceof FeatureVector)) {
      throw new Error('Dot product requires a FeatureVector');
    }

    let result = 0;
    for (const field of FeatureVector.REQUIRED_FIELDS) {
      result += this.getField(field) * other.getField(field);
    }
    return result;
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object with all features
   */
  toArray() {
    const result = {};
    for (const field of FeatureVector.REQUIRED_FIELDS) {
      result[field] = this.getField(field);
    }
    return result;
  }

  /**
   * Check equality with another vector
   * @param {*} other - Another object to compare
   * @returns {boolean} True if all features are equal
   */
  equals(other) {
    if (!(other instanceof FeatureVector)) {
      return false;
    }

    for (const field of FeatureVector.REQUIRED_FIELDS) {
      if (this.getField(field) !== other.getField(field)) {
        return false;
      }
    }
    return true;
  }
}
