import EvaluationPolicy from './EvaluationPolicy.js';

const STYLE_ROLES = new Set(['primary', 'secondary', 'accent']);
const DENSITY_VALUES = new Set(['intimate', 'balanced', 'open']);
const EMPTY_SPACE_MODES = new Set(['allow', 'discourage-excess', 'require-open']);

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

function normalizePriorityRule(value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`ClientBrief clientPriorities[${index}].rule must be an object`);
  }
  if (value.schemaVersion !== 1) {
    throw new Error(`ClientBrief clientPriorities[${index}].rule schemaVersion must be 1`);
  }
  const kind = requiredString(value.kind, `clientPriorities[${index}].rule.kind`);
  const messageKey = requiredString(value.messageKey, `clientPriorities[${index}].rule.messageKey`);
  if (kind === 'functional-scenario') {
    return Object.freeze({
      schemaVersion: 1,
      kind,
      scenarioId: requiredString(value.scenarioId, `clientPriorities[${index}].rule.scenarioId`),
      messageKey
    });
  }
  if (kind === 'spatial-preferences') {
    return Object.freeze({ schemaVersion: 1, kind, messageKey });
  }
  throw new Error(`ClientBrief clientPriorities[${index}].rule kind is not supported: ${kind}`);
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
      weight: finiteNumber(priority.weight, `clientPriorities[${index}].weight`, { min: 0, max: 5, exclusiveMin: true }),
      rule: normalizePriorityRule(priority.rule, index)
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
      targetFreeAreaRatio: finiteNumber(empty.targetFreeAreaRatio, 'spatialPreferences emptySpacePreference.targetFreeAreaRatio', { min: 0, max: 1 })
    })
  });
}

export class ClientBrief {
  constructor({ schemaVersion, id, levelId, client, title, summary, styleTargets, clientPriorities, spatialPreferences, evaluationPolicy } = {}) {
    if (schemaVersion !== 3) throw new Error('ClientBrief schemaVersion must be 3');
    this._schemaVersion = schemaVersion;
    this._id = requiredString(id, 'id');
    this._levelId = requiredString(levelId, 'levelId');
    this._client = normalizeClient(client);
    this._title = requiredString(title, 'title');
    this._summary = requiredString(summary, 'summary');
    this._styleTargets = normalizeStyleTargets(styleTargets);
    this._clientPriorities = normalizePriorities(clientPriorities);
    this._spatialPreferences = normalizeSpatialPreferences(spatialPreferences);
    this._evaluationPolicy = new EvaluationPolicy(evaluationPolicy, {
      clearanceMultiplier: this._spatialPreferences.clearanceMultiplier
    });
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
      clientPriorities: this.clientPriorities.map(priority => structuredClone(priority)),
      spatialPreferences: {
        density: this.spatialPreferences.density,
        clearanceMultiplier: this.spatialPreferences.clearanceMultiplier,
        emptySpacePreference: { ...this.spatialPreferences.emptySpacePreference }
      },
      evaluationPolicy: this.evaluationPolicy.toJSON()
    };
  }
}

export default ClientBrief;
