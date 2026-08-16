const STYLE_ROLES = new Set(['primary', 'secondary', 'accent']);
const DENSITY_VALUES = new Set(['intimate', 'balanced', 'open']);
const EMPTY_SPACE_MODES = new Set(['allow', 'discourage-excess', 'require-open']);
const CRITICAL_RULE_MODES = new Set(['block-completion', 'cap-stars', 'informational']);

import RequiredFunctionalScenario from '../Ergonomics/RequiredFunctionalScenario.js';

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`ClientBrief ${label} must be a non-empty string`);
  }
  return value.trim();
}

function finiteNumber(value, label, { min = -Infinity, max = Infinity, exclusiveMin = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || (exclusiveMin ? value <= min : value < min) || value > max) {
    throw new Error(`ClientBrief ${label} must be between ${min} and ${max}`);
  }
  return value;
}

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freezeDeep(nested);
  return Object.freeze(value);
}

function normalizeStyleTargets(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('ClientBrief styleTargets must be a non-empty array');
  }
  const styleIds = new Set();
  const normalized = value.map((target, index) => {
    if (!target || typeof target !== 'object' || Array.isArray(target)) {
      throw new Error(`ClientBrief styleTargets[${index}] must be an object`);
    }
    const styleId = requiredString(target.styleId, `styleTargets[${index}].styleId`);
    if (styleIds.has(styleId)) throw new Error(`ClientBrief styleTargets duplicate styleId: ${styleId}`);
    styleIds.add(styleId);
    if (!STYLE_ROLES.has(target.role)) {
      throw new Error(`ClientBrief styleTargets[${index}].role is not supported: ${target.role}`);
    }
    return Object.freeze({
      styleId,
      role: target.role,
      weight: finiteNumber(target.weight, `styleTargets[${index}].weight`, { min: 0, max: 1, exclusiveMin: true })
    });
  });
  const primaryCount = normalized.filter(target => target.role === 'primary').length;
  if (primaryCount !== 1) throw new Error('ClientBrief requires exactly one primary style target');
  const weightTotal = normalized.reduce((sum, target) => sum + target.weight, 0);
  if (Math.abs(weightTotal - 1) > 0.000001) {
    throw new Error('ClientBrief styleTargets weights must sum to 1');
  }
  return Object.freeze(normalized);
}

function normalizeClient(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ClientBrief client must be an object');
  }
  return Object.freeze({
    id: requiredString(value.id, 'client.id'),
    displayName: requiredString(value.displayName, 'client.displayName')
  });
}

function normalizePriorities(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('ClientBrief clientPriorities must be a non-empty array');
  }
  const ids = new Set();
  return Object.freeze(value.map((priority, index) => {
    if (!priority || typeof priority !== 'object' || Array.isArray(priority)) {
      throw new Error(`ClientBrief clientPriorities[${index}] must be an object`);
    }
    const id = requiredString(priority.id, `clientPriorities[${index}].id`);
    if (ids.has(id)) throw new Error(`ClientBrief clientPriorities duplicate id: ${id}`);
    ids.add(id);
    return Object.freeze({
      id,
      label: requiredString(priority.label, `clientPriorities[${index}].label`),
      weight: finiteNumber(priority.weight, `clientPriorities[${index}].weight`, { min: 0, max: 5, exclusiveMin: true })
    });
  }));
}

function normalizeSpatialPreferences(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ClientBrief spatialPreferences must be an object');
  }
  if (!DENSITY_VALUES.has(value.density)) {
    throw new Error(`ClientBrief spatialPreferences density is not supported: ${value.density}`);
  }
  const empty = value.emptySpacePreference;
  if (!empty || typeof empty !== 'object' || Array.isArray(empty) || !EMPTY_SPACE_MODES.has(empty.mode)) {
    throw new Error('ClientBrief spatialPreferences emptySpacePreference must use a supported mode');
  }
  return Object.freeze({
    density: value.density,
    clearanceMultiplier: finiteNumber(value.clearanceMultiplier, 'spatialPreferences clearanceMultiplier', { min: 0.25, max: 2 }),
    emptySpacePreference: Object.freeze({
      mode: empty.mode,
      targetFreeAreaRatio: finiteNumber(empty.targetFreeAreaRatio, 'spatialPreferences emptySpacePreference.targetFreeAreaRatio', { min: 0, max: 1 }),
      weight: finiteNumber(empty.weight, 'spatialPreferences emptySpacePreference.weight', { min: 0, max: 5, exclusiveMin: true })
    })
  });
}

function normalizeEvaluationPolicy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ClientBrief evaluationPolicy must be an object');
  }
  if (value.styleMode !== 'weighted-targets-v1') {
    throw new Error(`ClientBrief evaluationPolicy styleMode is not supported: ${value.styleMode}`);
  }
  const completion = value.completion;
  if (!completion || typeof completion !== 'object' || Array.isArray(completion)
    || !CRITICAL_RULE_MODES.has(completion.criticalRuleMode)) {
    throw new Error('ClientBrief evaluationPolicy completion must contain a supported criticalRuleMode');
  }
  const ergonomicsRules = value.ergonomicsRules ?? {};
  const requiredFunctionalScenarios = ergonomicsRules.requiredFunctionalScenarios;
  if (!Array.isArray(requiredFunctionalScenarios)) {
    throw new Error('ClientBrief evaluationPolicy ergonomicsRules.requiredFunctionalScenarios must be an array');
  }
  return freezeDeep({
    styleMode: value.styleMode,
    completion: {
      minimumStars: finiteNumber(completion.minimumStars, 'evaluationPolicy completion.minimumStars', { min: 1, max: 5 }),
      criticalRuleMode: completion.criticalRuleMode
    },
    compositionRules: { ...(value.compositionRules ?? {}) },
    ergonomicsRules: {
      ...ergonomicsRules,
      requiredFunctionalScenarios: requiredFunctionalScenarios.map(scenario => (
        new RequiredFunctionalScenario(scenario).toJSON()
      ))
    }
  });
}

export class ClientBrief {
  constructor({ schemaVersion, id, levelId, client, title, summary, styleTargets, clientPriorities, spatialPreferences, evaluationPolicy } = {}) {
    if (schemaVersion !== 1) throw new Error('ClientBrief schemaVersion must be 1');
    this._schemaVersion = schemaVersion;
    this._id = requiredString(id, 'id');
    this._levelId = requiredString(levelId, 'levelId');
    this._client = normalizeClient(client);
    this._title = requiredString(title, 'title');
    this._summary = requiredString(summary, 'summary');
    this._styleTargets = normalizeStyleTargets(styleTargets);
    this._clientPriorities = normalizePriorities(clientPriorities);
    this._spatialPreferences = normalizeSpatialPreferences(spatialPreferences);
    this._evaluationPolicy = normalizeEvaluationPolicy(evaluationPolicy);
    Object.freeze(this);
  }

  get schemaVersion() { return this._schemaVersion; }
  get id() { return this._id; }
  get levelId() { return this._levelId; }
  get client() { return this._client; }
  get title() { return this._title; }
  get summary() { return this._summary; }
  get styleTargets() { return this._styleTargets; }
  get primaryStyleTarget() { return this._styleTargets.find(target => target.role === 'primary'); }
  get clientPriorities() { return this._clientPriorities; }
  get spatialPreferences() { return this._spatialPreferences; }
  get evaluationPolicy() { return this._evaluationPolicy; }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      id: this.id,
      levelId: this.levelId,
      client: { ...this.client },
      title: this.title,
      summary: this.summary,
      styleTargets: this.styleTargets.map(target => ({ ...target })),
      clientPriorities: this.clientPriorities.map(priority => ({ ...priority })),
      spatialPreferences: {
        density: this.spatialPreferences.density,
        clearanceMultiplier: this.spatialPreferences.clearanceMultiplier,
        emptySpacePreference: { ...this.spatialPreferences.emptySpacePreference }
      },
      evaluationPolicy: structuredClone(this.evaluationPolicy)
    };
  }
}

export default ClientBrief;
