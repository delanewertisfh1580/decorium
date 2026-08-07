// =============================================================================
// domain/value-objects/FeatureVector.js — Value Object для вектора признаков.
// Иммутабельный: Object.freeze в конструкторе защищает от мутаций.
// =============================================================================

import { FEATURE_COUNT } from '../features.js';

/**
 * Value Object: нормализованный вектор признаков предмета.
 * Каждый элемент — число в диапазоне [0..1].
 * 
 * @example
 * const vec = new FeatureVector([0.8, 0.2, 0.9, ...]);
 * console.log(vec.get(0)); // 0.8
 * 
 * const avg = FeatureVector.weightedAverage([v1, v2], [0.7, 0.3]);
 */
export class FeatureVector {
  /**
   * @param {number[]} values массив из FEATURE_COUNT чисел
   */
  constructor(values) {
    if (!Array.isArray(values)) {
      throw new Error('FeatureVector: values должен быть массивом');
    }
    if (values.length !== FEATURE_COUNT) {
      throw new Error(`FeatureVector: ожидается ${FEATURE_COUNT} элементов, получено ${values.length}`);
    }
    if (!values.every(v => typeof v === 'number' && Number.isFinite(v))) {
      throw new Error('FeatureVector: все элементы должны быть числами');
    }

    this.values = Object.freeze([...values]);
    Object.freeze(this);
  }

  /**
   * Длина вектора (количество признаков).
   * @returns {number}
   */
  get length() {
    return this.values.length;
  }

  /**
   * Получить значение признака по индексу.
   * @param {number} index индекс в диапазоне [0, length)
   * @returns {number}
   */
  get(index) {
    if (index < 0 || index >= this.length) {
      throw new Error(`FeatureVector: индекс ${index} вне диапазона [0, ${this.length})`);
    }
    return this.values[index];
  }

  /**
   * Взвешенное среднее нескольких векторов.
   * Используется для вычисления вектора комнаты из векторов предметов.
   * 
   * @param {FeatureVector[]} vectors массив векторов
   * @param {number[]} [weights] массив весов (если не указан, все веса = 1)
   * @returns {FeatureVector} новый вектор — среднее
   */
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
      v.values.forEach((val, j) => {
        acc[j] += val * w;
      });
      totalWeight += w;
    });

    if (totalWeight === 0) {
      return new FeatureVector(new Array(featureCount).fill(0));
    }

    return new FeatureVector(acc.map(x => x / totalWeight));
  }

  /**
   * Проверка равенства (с допуском для float).
   * @param {FeatureVector} other
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof FeatureVector)) return false;
    if (this.length !== other.length) return false;
    return this.values.every((val, i) => Math.abs(val - other.values[i]) < 1e-9);
  }

  /**
   * Сериализация в plain array (для JSON/отладки).
   * @returns {number[]}
   */
  toJSON() {
    return [...this.values];
  }
}