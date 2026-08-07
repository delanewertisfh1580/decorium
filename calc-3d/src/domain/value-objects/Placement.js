// =============================================================================
// domain/value-objects/Placement.js — Value Object для позиции и габаритов.
// Иммутабельный: Object.freeze в конструкторе защищает от мутаций.
// =============================================================================

/**
 * Value Object: позиция и габариты предмета в 3D-пространстве.
 * 
 * @example
 * const placement = new Placement({ x: 1, y: 0, z: 2, w: 1.5, d: 0.8, h: 0.5 });
 * console.log(placement.footprintArea); // 1.2
 * console.log(placement.distanceTo(otherPlacement)); // расстояние по XZ
 */
export class Placement {
    /**
     * @param {object} params
     * @param {number} params.x Позиция по X (мировые координаты)
     * @param {number} params.y Позиция по Y (высота от пола)
     * @param {number} params.z Позиция по Z (мировые координаты)
     * @param {number} params.w Ширина (по X)
     * @param {number} params.d Глубина (по Z)
     * @param {number} params.h Высота (по Y)
     */
    constructor({ x, y, z, w, d, h }) {
      if (typeof x !== 'number' || !Number.isFinite(x)) {
        throw new Error('Placement: x должен быть числом');
      }
      if (typeof y !== 'number' || !Number.isFinite(y)) {
        throw new Error('Placement: y должен быть числом');
      }
      if (typeof z !== 'number' || !Number.isFinite(z)) {
        throw new Error('Placement: z должен быть числом');
      }
      if (typeof w !== 'number' || w <= 0) {
        throw new Error('Placement: w должен быть положительным числом');
      }
      if (typeof d !== 'number' || d <= 0) {
        throw new Error('Placement: d должен быть положительным числом');
      }
      if (typeof h !== 'number' || h <= 0) {
        throw new Error('Placement: h должен быть положительным числом');
      }
  
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      this.d = d;
      this.h = h;
      
      Object.freeze(this);
    }
  
    /**
     * Площадь "следа" предмета на полу (для взвешенного среднего в scoring).
     * @returns {number} площадь в м²
     */
    get footprintArea() {
      return this.w * this.d;
    }
  
    /**
     * Объём предмета.
     * @returns {number} объём в м³
     */
    get volume() {
      return this.w * this.d * this.h;
    }
  
    /**
     * Расстояние между центрами двух предметов по плоскости XZ.
     * @param {Placement} other другой Placement
     * @returns {number} евклидово расстояние
     */
    distanceTo(other) {
      if (!(other instanceof Placement)) {
        throw new Error('distanceTo: аргумент должен быть Placement');
      }
      return Math.hypot(this.x - other.x, this.z - other.z);
    }
  
    /**
     * Проверка равенства (все поля совпадают).
     * @param {Placement} other
     * @returns {boolean}
     */
    equals(other) {
      if (!(other instanceof Placement)) return false;
      return this.x === other.x &&
             this.y === other.y &&
             this.z === other.z &&
             this.w === other.w &&
             this.d === other.d &&
             this.h === other.h;
    }
  
    /**
     * Сериализация в plain object (для JSON/отладки).
     * @returns {object}
     */
    toJSON() {
      return {
        x: this.x, y: this.y, z: this.z,
        w: this.w, d: this.d, h: this.h
      };
    }
  }