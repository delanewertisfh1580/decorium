function requireFinishId(value, label) {
  if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`SurfaceConfiguration ${label} must be a lowercase identifier.`);
  }
  return value;
}

export class SurfaceConfiguration {
  constructor({ floorFinishId, wallFinishId }) {
    this._floorFinishId = requireFinishId(floorFinishId, 'floorFinishId');
    this._wallFinishId = requireFinishId(wallFinishId, 'wallFinishId');
    Object.freeze(this);
  }

  get floorFinishId() { return this._floorFinishId; }
  get wallFinishId() { return this._wallFinishId; }

  withFinish(surface, finishId) {
    if (surface === 'floor') return new SurfaceConfiguration({ floorFinishId: finishId, wallFinishId: this.wallFinishId });
    if (surface === 'wall') return new SurfaceConfiguration({ floorFinishId: this.floorFinishId, wallFinishId: finishId });
    throw new Error('SurfaceConfiguration surface must be floor or wall.');
  }

  toJSON() {
    return Object.freeze({ floorFinishId: this.floorFinishId, wallFinishId: this.wallFinishId });
  }
}

export default SurfaceConfiguration;
