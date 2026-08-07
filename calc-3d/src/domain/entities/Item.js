// =============================================================================
// domain/entities/Item.js — Entity предмета интерьера.
// Иммутабельный: методы withPlacement/withFeatures возвращают новые экземпляры.
// =============================================================================

import { Placement } from '../value-objects/Placement.js';
import { FeatureVector } from '../value-objects/FeatureVector.js';

/**
 * Entity: предмет интерьера с уникальным идентификатором.
 * 
 * @example
 * const item = new Item({
 *   id: 1,
 *   type: 'sofa',
 *   placement: new Placement({ x: 0, y: 0, z: 0, w: 2, d: 1, h: 0.8 }),
 *   features: new FeatureVector([0.8, 0.1, 0.9, ...])
 * });
 * 
 * const moved = item.withPlacement(newPlacement);
 */
export class Item {
  /**
   * @param {object} params
   * @param {number|string} params.id уникальный идентификатор
   * @param {string} params.type тип предмета (box, sofa, shelf, ...)
   * @param {Placement} params.placement позиция и габариты
   * @param {FeatureVector} params.features вектор признаков
   * @param {string} [params.catalogId] id в каталоге (по умолчанию = type)
   */
  constructor({ id, type, placement, features, catalogId }) {
    if (typeof id !== 'number' && typeof id !== 'string') {
      throw new Error('Item: id должен быть числом или строкой');
    }
    if (typeof type !== 'string') {
      throw new Error('Item: type должен быть строкой');
    }
    if (!(placement instanceof Placement)) {
      throw new Error('Item: placement должен быть экземпляром Placement');
    }
    if (!(features instanceof FeatureVector)) {
      throw new Error('Item: features должен быть экземпляром FeatureVector');
    }

    this.id = id;
    this.type = type;
    this.placement = placement;
    this.features = features;
    this.catalogId = catalogId || type;
    
    Object.freeze(this);
  }

  /**
   * Создать копию с новой позицией (immutable update).
   * @param {Placement} newPlacement
   * @returns {Item} новый Item с обновлённой позицией
   */
  withPlacement(newPlacement) {
    if (!(newPlacement instanceof Placement)) {
      throw new Error('withPlacement: аргумент должен быть Placement');
    }
    return new Item({
      id: this.id,
      type: this.type,
      placement: newPlacement,
      features: this.features,
      catalogId: this.catalogId
    });
  }

  /**
   * Создать копию с новым вектором признаков (immutable update).
   * @param {FeatureVector} newFeatures
   * @returns {Item} новый Item с обновлёнными признаками
   */
  withFeatures(newFeatures) {
    if (!(newFeatures instanceof FeatureVector)) {
      throw new Error('withFeatures: аргумент должен быть FeatureVector');
    }
    return new Item({
      id: this.id,
      type: this.type,
      placement: this.placement,
      features: newFeatures,
      catalogId: this.catalogId
    });
  }

  /**
   * Проверка равенства по id.
   * @param {Item} other
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Item)) return false;
    return this.id === other.id;
  }

  /**
   * Сериализация в plain object (для JSON/отладки).
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      placement: this.placement.toJSON(),
      features: this.features.toJSON(),
      catalogId: this.catalogId
    };
  }
}