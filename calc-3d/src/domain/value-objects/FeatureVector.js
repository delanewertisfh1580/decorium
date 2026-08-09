// =============================================================================
// domain/value-objects/FeatureVector.js — Value Object для вектора признаков.
// =============================================================================

import { FEATURE_COUNT } from '../features.js';

export class FeatureVector {
  constructor(values) {
    if (!Array.isArray(values)) throw new Error('FeatureVector: values должен быть массивом');
    if (values.length !== FEATURE_COUNT) throw new Error(`FeatureVector: ожидается ${FEATURE_COUNT} элементов`);
    if (!values.every(v => typeof v === 'number' && Number.isFinite(v))) {
      throw new Error('FeatureVector: все элементы должны быть числами');
    }

    this.values = Object.freeze([...values]);
    Object.freeze(this);
  }

  get length() { return this.values.length; }

  get(index) {
    if (index < 0 || index >= this.length) throw new Error(`FeatureVector: индекс ${index} вне диапазона`);
    return this.values[index];
  }

  static weightedAverage(vectors, weights) {
    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new Error('weightedAverage: vectors не должен быть пустым');
    }
    if (!vectors.every(v => v instanceof FeatureVector)) {
      throw new Error('weightedAverage: все элементы должны быть FeatureVector');
    }

    const featureCount = vectors[0].length;
    if (!vectors.every(v => v.length === featureCount)) {
      throw new Error('weightedAverage: все векторы должны иметь одинаковую длину');
    }

    const weightsArr = weights || vectors.map(() => 1);
    if (weightsArr.length !== vectors.length) {
      throw new Error('weightedAverage: длины vectors и weights должны совпадать');
    }

    const acc = new Array(featureCount).fill(0);
    let totalWeight = 0;

    vectors.forEach((v, i) => {
      const w = weightsArr[i] || 1;
      v.values.forEach((val, j) => { acc[j] += val * w; });
      totalWeight += w;
    });

    if (totalWeight === 0) {
      return new FeatureVector(new Array(featureCount).fill(0));
    }

    return new FeatureVector(acc.map(x => x / totalWeight));
  }

  equals(other) {
    if (!(other instanceof FeatureVector)) return false;
    if (this.length !== other.length) return false;
    return this.values.every((val, i) => Math.abs(val - other.values[i]) < 1e-9);
  }

  toJSON() { return [...this.values]; }
}
