const UI_SCALES = Object.freeze(['standard', 'large']);
const QUALITY_TIERS = Object.freeze(['balanced', 'performance']);

function requireBoolean(value, label) {
  if (typeof value !== 'boolean') throw new Error(`PlayerSettings ${label} must be a boolean`);
  return value;
}

function requireEnum(value, allowedValues, label) {
  if (!allowedValues.includes(value)) {
    throw new Error(`PlayerSettings ${label} must be one of: ${allowedValues.join(', ')}`);
  }
  return value;
}

export class PlayerSettings {
  static createDefault() {
    return new PlayerSettings({
      reducedMotion: false,
      uiScale: 'standard',
      qualityTier: 'balanced'
    });
  }

  static fromData(data) {
    return new PlayerSettings(data);
  }

  constructor({ reducedMotion, uiScale, qualityTier }) {
    this._reducedMotion = requireBoolean(reducedMotion, 'reducedMotion');
    this._uiScale = requireEnum(uiScale, UI_SCALES, 'uiScale');
    this._qualityTier = requireEnum(qualityTier, QUALITY_TIERS, 'qualityTier');
    Object.freeze(this);
  }

  get reducedMotion() { return this._reducedMotion; }
  get uiScale() { return this._uiScale; }
  get qualityTier() { return this._qualityTier; }

  withChanges(changes) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      throw new Error('PlayerSettings changes must be an object');
    }
    return new PlayerSettings({ ...this.toJSON(), ...changes });
  }

  toJSON() {
    return {
      reducedMotion: this.reducedMotion,
      uiScale: this.uiScale,
      qualityTier: this.qualityTier
    };
  }
}

export default PlayerSettings;
