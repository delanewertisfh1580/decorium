const PLACEMENT_KINDS = new Set(['floor', 'floor-overlay', 'wall', 'ceiling', 'surface-mounted']);
const OCCUPANCY_MODES = new Set(['occupies', 'ignored']);
const CLEARANCE_MODES = new Set(['obstacle', 'ignored']);
const SUPPORT_MODES = new Set(['none', 'surface']);

function requireEnum(value, values, name) {
  if (!values.has(value)) {
    throw new Error(`SpatialBehavior ${name} is invalid: ${value}`);
  }
}

export class SpatialBehavior {
  constructor({
    schemaVersion,
    placementKind,
    occupancyMode,
    clearanceMode,
    supportMode
  } = {}) {
    if (schemaVersion !== 1) {
      throw new Error('SpatialBehavior schemaVersion must be 1');
    }
    requireEnum(placementKind, PLACEMENT_KINDS, 'placementKind');
    requireEnum(occupancyMode, OCCUPANCY_MODES, 'occupancyMode');
    requireEnum(clearanceMode, CLEARANCE_MODES, 'clearanceMode');
    requireEnum(supportMode, SUPPORT_MODES, 'supportMode');

    if (placementKind === 'floor-overlay' && (occupancyMode !== 'ignored' || clearanceMode !== 'ignored')) {
      throw new Error('SpatialBehavior floor-overlay must ignore occupancy and clearance');
    }
    if (['wall', 'ceiling', 'surface-mounted'].includes(placementKind) &&
        (occupancyMode !== 'ignored' || clearanceMode !== 'ignored')) {
      throw new Error(`SpatialBehavior ${placementKind} must ignore occupancy and clearance`);
    }
    if (placementKind === 'floor' && occupancyMode === 'occupies' && clearanceMode !== 'obstacle') {
      throw new Error('SpatialBehavior floor occupancy requires obstacle clearance');
    }

    this._schemaVersion = schemaVersion;
    this._placementKind = placementKind;
    this._occupancyMode = occupancyMode;
    this._clearanceMode = clearanceMode;
    this._supportMode = supportMode;
    Object.freeze(this);
  }

  static defaultFloorObstacle() {
    return new SpatialBehavior({
      schemaVersion: 1,
      placementKind: 'floor',
      occupancyMode: 'occupies',
      clearanceMode: 'obstacle',
      supportMode: 'none'
    });
  }

  get schemaVersion() { return this._schemaVersion; }
  get placementKind() { return this._placementKind; }
  get occupancyMode() { return this._occupancyMode; }
  get clearanceMode() { return this._clearanceMode; }
  get supportMode() { return this._supportMode; }
  get isFloorObstacle() {
    return this.placementKind === 'floor' && this.occupancyMode === 'occupies' && this.clearanceMode === 'obstacle';
  }
  get providesSupportSurface() { return this.supportMode === 'surface'; }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      placementKind: this.placementKind,
      occupancyMode: this.occupancyMode,
      clearanceMode: this.clearanceMode,
      supportMode: this.supportMode
    };
  }
}

export default SpatialBehavior;
