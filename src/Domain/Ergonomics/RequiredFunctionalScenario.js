const SUPPORTED_AFFORDANCES = new Set([
  'dining-seat',
  'dining-surface',
  'lounge-seat',
  'coffee-surface',
  'view-target',
  'work-seat',
  'work-surface'
]);

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`RequiredFunctionalScenario ${label} must be a non-empty string`);
  }
  return value.trim();
}

function normalizeRequiredRoles(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('RequiredFunctionalScenario requiredRoles must be a non-empty array');
  }
  const affordances = new Set();
  return Object.freeze(value.map((role, index) => {
    if (!role || typeof role !== 'object' || Array.isArray(role)) {
      throw new Error(`RequiredFunctionalScenario requiredRoles[${index}] must be an object`);
    }
    const affordance = requiredString(role.affordance, `requiredRoles[${index}].affordance`);
    if (!SUPPORTED_AFFORDANCES.has(affordance)) {
      throw new Error(`RequiredFunctionalScenario affordance is not supported: ${affordance}`);
    }
    if (affordances.has(affordance)) {
      throw new Error(`RequiredFunctionalScenario duplicate affordance: ${affordance}`);
    }
    affordances.add(affordance);
    if (!Number.isInteger(role.minCount) || role.minCount < 1) {
      throw new Error(`RequiredFunctionalScenario requiredRoles[${index}].minCount must be a positive integer`);
    }
    return Object.freeze({ affordance, minCount: role.minCount });
  }));
}

export class RequiredFunctionalScenario {
  constructor({
    schemaVersion,
    id,
    label,
    requiredRoles,
    weight = 1,
    critical = false,
    messageKey
  } = {}) {
    if (schemaVersion !== 1) throw new Error('RequiredFunctionalScenario schemaVersion must be 1');
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
      throw new Error('RequiredFunctionalScenario weight must be a positive number');
    }
    if (typeof critical !== 'boolean') {
      throw new Error('RequiredFunctionalScenario critical must be a boolean');
    }
    this._schemaVersion = schemaVersion;
    this._id = requiredString(id, 'id');
    this._label = requiredString(label, 'label');
    this._requiredRoles = normalizeRequiredRoles(requiredRoles);
    this._weight = weight;
    this._critical = critical;
    this._messageKey = requiredString(messageKey, 'messageKey');
    Object.freeze(this);
  }

  get schemaVersion() { return this._schemaVersion; }
  get id() { return this._id; }
  get label() { return this._label; }
  get requiredRoles() { return this._requiredRoles; }
  get weight() { return this._weight; }
  get critical() { return this._critical; }
  get messageKey() { return this._messageKey; }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      id: this.id,
      label: this.label,
      requiredRoles: this.requiredRoles.map(role => ({ ...role })),
      weight: this.weight,
      critical: this.critical,
      messageKey: this.messageKey
    };
  }
}

export default RequiredFunctionalScenario;
