import { FeatureVector } from './FeatureVector.js';

/**
 * Item Entity - represents a placeable object in the room.
 * Immutable after creation.
 */
export class Item {
  /**
   * @type {string}
   */
  #id;

  /**
   * @type {string}
   */
  #name;

  /**
   * @type {string}
   */
  #type;

  /**
   * @type {FeatureVector}
   */
  #featureVector;

  /**
   * @type {{ width?: number, height?: number, depth?: number } | undefined}
   */
  #metadata;

  /**
   * @param {Object} params
   * @param {string} params.id - Unique identifier for the item
   * @param {string} params.name - Human-readable name
   * @param {string} params.type - Item type (e.g., 'chair', 'table', 'decor')
   * @param {FeatureVector} params.featureVector - Feature vector describing item characteristics
   * @param {{ width?: number, height?: number, depth?: number }} [params.metadata] - Optional physical dimensions
   */
  constructor({ id, name, type, featureVector, metadata }) {
    // Validation
    if (id === undefined || id === null) {
      throw new Error('Item ID is required');
    }
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('Item ID cannot be empty');
    }
    if (!name) {
      throw new Error('Item name is required');
    }
    if (!type) {
      throw new Error('Item type is required');
    }
    if (!featureVector) {
      throw new Error('Item featureVector is required');
    }
    if (!(featureVector instanceof FeatureVector)) {
      throw new Error('featureVector must be an instance of FeatureVector');
    }

    this.#id = id.trim();
    this.#name = name;
    this.#type = type;
    this.#featureVector = featureVector;
    this.#metadata = metadata;

    // Freeze to enforce immutability
    Object.freeze(this);
  }

  /**
   * @returns {string}
   */
  get id() {
    return this.#id;
  }

  /**
   * @returns {string}
   */
  get name() {
    return this.#name;
  }

  /**
   * @returns {string}
   */
  get type() {
    return this.#type;
  }

  /**
   * @returns {FeatureVector}
   */
  get featureVector() {
    return this.#featureVector;
  }

  /**
   * @returns {{ width?: number, height?: number, depth?: number } | undefined}
   */
  get metadata() {
    return this.#metadata;
  }
}
