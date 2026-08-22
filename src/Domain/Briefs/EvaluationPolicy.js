import MinimumClearanceRule from '../Ergonomics/MinimumClearanceRule.js';
import PassageZone from '../Ergonomics/PassageZone.js';
import FunctionalLayoutRule from '../Ergonomics/FunctionalLayoutRule.js';
import RequiredFunctionalScenario from '../Ergonomics/RequiredFunctionalScenario.js';

const CRITICAL_RULE_MODES = new Set(['block-completion', 'cap-stars', 'informational']);

function requiredObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`ClientBrief ${label} must be an object`);
  }
  return value;
}

function finiteNumber(value, label, { min = -Infinity, max = Infinity, exclusiveMin = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || (exclusiveMin ? value <= min : value < min) || value > max) {
    throw new Error(`ClientBrief ${label} must be between ${min} and ${max}`);
  }
  return value;
}

function positiveClearanceMultiplier(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error('ClientBrief spatialPreferences clearanceMultiplier must be a positive number');
  }
  return value;
}

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freezeDeep(nested);
  return Object.freeze(value);
}

export class CompletionPolicy {
  constructor(value) {
    requiredObject(value, 'evaluationPolicy completion');
    if (!CRITICAL_RULE_MODES.has(value.criticalRuleMode)) {
      throw new Error('ClientBrief evaluationPolicy completion must contain a supported criticalRuleMode');
    }
    this._minimumStars = finiteNumber(value.minimumStars, 'evaluationPolicy completion.minimumStars', { min: 1, max: 5 });
    this._criticalRuleMode = value.criticalRuleMode;
    Object.freeze(this);
  }

  get minimumStars() { return this._minimumStars; }
  get criticalRuleMode() { return this._criticalRuleMode; }

  toJSON() {
    return { minimumStars: this.minimumStars, criticalRuleMode: this.criticalRuleMode };
  }
}

export class CompositionRules {
  constructor(value = {}) {
    requiredObject(value, 'evaluationPolicy compositionRules');
    const supportedKeys = new Set(['minItems', 'requiredAffordances']);
    const unexpectedKey = Object.keys(value).find(key => !supportedKeys.has(key));
    if (unexpectedKey) {
      throw new Error(`ClientBrief evaluationPolicy compositionRules.${unexpectedKey} is not supported`);
    }

    if (value.minItems !== undefined && (!Number.isInteger(value.minItems) || value.minItems < 1)) {
      throw new Error('ClientBrief evaluationPolicy compositionRules.minItems must be a positive integer');
    }
    if (value.requiredAffordances !== undefined && (!Array.isArray(value.requiredAffordances)
      || !value.requiredAffordances.every(affordance => typeof affordance === 'string' && affordance.trim() !== ''))) {
      throw new Error('ClientBrief evaluationPolicy compositionRules.requiredAffordances must be an array of non-empty strings');
    }

    const requiredAffordances = value.requiredAffordances?.map(affordance => affordance.trim()) ?? [];
    if (new Set(requiredAffordances).size !== requiredAffordances.length) {
      throw new Error('ClientBrief evaluationPolicy compositionRules.requiredAffordances must be unique');
    }

    this._minItems = value.minItems;
    this._requiredAffordances = Object.freeze(requiredAffordances);
    Object.freeze(this);
  }

  get minItems() { return this._minItems; }
  get requiredAffordances() { return this._requiredAffordances; }

  toJSON() {
    const serialized = {};
    if (this.minItems !== undefined) serialized.minItems = this.minItems;
    if (this.requiredAffordances.length > 0) serialized.requiredAffordances = [...this.requiredAffordances];
    return serialized;
  }
}

export class ErgonomicsPolicy {
  constructor(value = {}, { clearanceMultiplier = 1 } = {}) {
    requiredObject(value, 'evaluationPolicy ergonomicsRules');
    const requiredFunctionalScenarios = value.requiredFunctionalScenarios;
    if (!Array.isArray(requiredFunctionalScenarios)) {
      throw new Error('ClientBrief evaluationPolicy ergonomicsRules.requiredFunctionalScenarios must be an array');
    }
    if (value.passageZones !== undefined && !Array.isArray(value.passageZones)) {
      throw new Error('ClientBrief evaluationPolicy ergonomicsRules.passageZones must be an array');
    }
    if (value.functionalLayoutRules !== undefined && !Array.isArray(value.functionalLayoutRules)) {
      throw new Error('ClientBrief evaluationPolicy ergonomicsRules.functionalLayoutRules must be an array');
    }

    this._minimumClearance = value.minimumClearance
      ? new MinimumClearanceRule({ ...value.minimumClearance, clientMultiplier: positiveClearanceMultiplier(clearanceMultiplier) })
      : null;
    this._passageZones = Object.freeze((value.passageZones ?? []).map(zone => new PassageZone(zone)));
    this._functionalLayoutRules = Object.freeze(
      (value.functionalLayoutRules ?? []).map(rule => new FunctionalLayoutRule(rule))
    );
    this._requiredFunctionalScenarios = Object.freeze(
      requiredFunctionalScenarios.map(scenario => new RequiredFunctionalScenario(scenario))
    );
    Object.freeze(this);
  }

  get minimumClearance() { return this._minimumClearance; }
  get passageZones() { return this._passageZones; }
  get functionalLayoutRules() { return this._functionalLayoutRules; }
  get requiredFunctionalScenarios() { return this._requiredFunctionalScenarios; }

}

export class EvaluationPolicy {
  constructor(value, { clearanceMultiplier = 1 } = {}) {
    requiredObject(value, 'evaluationPolicy');
    if (value.styleMode !== 'weighted-targets-v1') {
      throw new Error(`ClientBrief evaluationPolicy styleMode is not supported: ${value.styleMode}`);
    }

    this._styleMode = value.styleMode;
    this._completion = new CompletionPolicy(value.completion);
    this._compositionRules = new CompositionRules(value.compositionRules ?? {});
    this._ergonomicsRules = new ErgonomicsPolicy(value.ergonomicsRules ?? {}, { clearanceMultiplier });
    this._authored = freezeDeep(structuredClone(value));
    Object.freeze(this);
  }

  get styleMode() { return this._styleMode; }
  get completion() { return this._completion; }
  get compositionRules() { return this._compositionRules; }
  get ergonomicsRules() { return this._ergonomicsRules; }

  toJSON() {
    return structuredClone(this._authored);
  }
}

export default EvaluationPolicy;
