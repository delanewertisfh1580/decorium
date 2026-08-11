/**
 * RoomBounds: playable floor dimensions and optional clearance rectangles.
 */
export class RoomBounds {
  constructor(width, depth, doors = [], windows = []) {
    if (typeof width !== 'number' || width <= 0 || typeof depth !== 'number' || depth <= 0) {
      throw new Error('INVALID_BOUNDS: width and depth must be positive');
    }

    this.width = width;
    this.depth = depth;
    // Kept as an alias for the original MVP tests and DTO vocabulary.
    this.height = depth;
    this.doors = doors.map(rect => this._normalizeRect(rect));
    this.windows = windows.map(rect => this._normalizeRect(rect));
  }

  _normalizeRect(rect) {
    return {
      x: rect.x,
      z: rect.z ?? rect.y ?? 0,
      width: rect.width,
      depth: rect.depth ?? rect.height ?? 0,
      clearance: rect.clearance ?? 0.9
    };
  }

  isInside(x, z) {
    return x >= 0 && x <= this.width && z >= 0 && z <= this.depth;
  }

  getClearanceRects() {
    return [...this.doors, ...this.windows];
  }
}
