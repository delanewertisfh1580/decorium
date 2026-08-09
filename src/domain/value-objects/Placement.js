// =============================================================================
// domain/value-objects/Placement.js — Value Object для позиции и габаритов.
// Иммутабельный: Object.freeze защищает от мутаций.
// =============================================================================

export class Placement {
    constructor({ x, y, z, w, d, h }) {
      if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('Placement: x должен быть числом');
      if (typeof y !== 'number' || !Number.isFinite(y)) throw new Error('Placement: y должен быть числом');
      if (typeof z !== 'number' || !Number.isFinite(z)) throw new Error('Placement: z должен быть числом');
      if (typeof w !== 'number' || w <= 0) throw new Error('Placement: w должен быть положительным числом');
      if (typeof d !== 'number' || d <= 0) throw new Error('Placement: d должен быть положительным числом');
      if (typeof h !== 'number' || h <= 0) throw new Error('Placement: h должен быть положительным числом');
  
      this.x = x; this.y = y; this.z = z;
      this.w = w; this.d = d; this.h = h;
      
      Object.freeze(this);
    }
  
    get footprintArea() { return this.w * this.d; }
    get volume() { return this.w * this.d * this.h; }
  
    distanceTo(other) {
      if (!(other instanceof Placement)) throw new Error('distanceTo: аргумент должен быть Placement');
      return Math.hypot(this.x - other.x, this.z - other.z);
    }
  
    equals(other) {
      if (!(other instanceof Placement)) return false;
      return this.x === other.x && this.y === other.y && this.z === other.z &&
             this.w === other.w && this.d === other.d && this.h === other.h;
    }
  
    toJSON() {
      return { x: this.x, y: this.y, z: this.z, w: this.w, d: this.d, h: this.h };
    }
  }