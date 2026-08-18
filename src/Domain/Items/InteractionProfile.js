const SUPPORTED_AFFORDANCES = new Set([
  'dining-seat',
  'dining-surface',
  'lounge-seat',
  'coffee-surface',
  'view-target',
  'work-seat',
  'work-surface',
  'rest-surface',
  'storage-volume',
  'light-source',
  'floor-decor',
  'wall-decor',
  'media-support'
]);
const SUPPORTED_AXES = new Set(['positiveX', 'negativeX', 'positiveZ', 'negativeZ']);

export class InteractionProfile {
  constructor({ schemaVersion, affordances = [], frontAxis = null, usableSides = [] } = {}) {
    if (schemaVersion !== 1) {
      throw new Error('InteractionProfile schemaVersion must be 1');
    }
    if (!Array.isArray(affordances) || !affordances.every(affordance => typeof affordance === 'string')) {
      throw new Error('InteractionProfile affordances must be an array of strings');
    }
    if (new Set(affordances).size !== affordances.length) {
      throw new Error('InteractionProfile affordances must be unique');
    }
    for (const affordance of affordances) {
      if (!SUPPORTED_AFFORDANCES.has(affordance)) {
        throw new Error(`InteractionProfile affordance is not supported: ${affordance}`);
      }
    }
    if (frontAxis !== null && !SUPPORTED_AXES.has(frontAxis)) {
      throw new Error(`InteractionProfile frontAxis is invalid: ${frontAxis}`);
    }
    if (!Array.isArray(usableSides) || !usableSides.every(side => SUPPORTED_AXES.has(side))) {
      throw new Error('InteractionProfile usableSides must contain supported axes');
    }
    if (new Set(usableSides).size !== usableSides.length) {
      throw new Error('InteractionProfile usableSides must be unique');
    }

    this._schemaVersion = schemaVersion;
    this._affordances = Object.freeze([...affordances]);
    this._frontAxis = frontAxis;
    this._usableSides = Object.freeze([...usableSides]);
    Object.freeze(this);
  }

  static empty() {
    return new InteractionProfile({ schemaVersion: 1 });
  }

  get schemaVersion() { return this._schemaVersion; }
  get affordances() { return this._affordances; }
  get frontAxis() { return this._frontAxis; }
  get usableSides() { return this._usableSides; }

  hasAffordance(affordance) {
    return this._affordances.includes(affordance);
  }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      affordances: [...this.affordances],
      frontAxis: this.frontAxis,
      usableSides: [...this.usableSides]
    };
  }
}

export default InteractionProfile;
