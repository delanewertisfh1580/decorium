/**
 * RoomBounds: границы комнаты, двери, окна с зонами clearance.
 */
export class RoomBounds {
  constructor(width, height, doors = [], windows = []) {
    if (width <= 0 || height <= 0) {
      throw new Error('INVALID_BOUNDS: width and height must be positive');
    }
    this.width = width;
    this.height = height;
    this.doors = doors.map(d => this._normalizeRect(d));
    this.windows = windows.map(w => this._normalizeRect(w));
  }

  _normalizeRect(rect) {
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      clearance: rect.clearance || 0.9 // default 0.9m clearance
    };
  }

  isInside(x, z) {
    return x >= 0 && x <= this.width && z >= 0 && z <= this.height;
  }

  getClearanceRects() {
    return [...this.doors, ...this.windows];
  }
}
