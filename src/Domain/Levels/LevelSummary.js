const LEVEL_ID_PATTERN = /^[a-z0-9-]+$/;

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`LevelSummary ${label} must be a non-empty string`);
  }
  return value.trim();
}

function normalizePrerequisiteLevelId(value) {
  if (value === null || value === undefined) return null;
  const normalized = requireText(value, 'prerequisiteLevelId');
  if (!LEVEL_ID_PATTERN.test(normalized)) {
    throw new Error('LevelSummary prerequisiteLevelId must use lowercase letters, numbers and hyphens only');
  }
  return normalized;
}

export class LevelSummary {
  constructor({ id, name, description, sortOrder, prerequisiteLevelId = null }) {
    this._id = requireText(id, 'id');
    if (!LEVEL_ID_PATTERN.test(this._id)) {
      throw new Error('LevelSummary id must use lowercase letters, numbers and hyphens only');
    }
    this._name = requireText(name, 'name');
    this._description = requireText(description, 'description');
    if (!Number.isInteger(sortOrder) || sortOrder < 1) {
      throw new Error('LevelSummary sortOrder must be a positive integer');
    }
    this._sortOrder = sortOrder;
    this._prerequisiteLevelId = normalizePrerequisiteLevelId(prerequisiteLevelId);
    if (this._prerequisiteLevelId === this._id) {
      throw new Error('LevelSummary cannot require itself as prerequisite');
    }
    Object.freeze(this);
  }

  get id() { return this._id; }
  get name() { return this._name; }
  get description() { return this._description; }
  get sortOrder() { return this._sortOrder; }
  get prerequisiteLevelId() { return this._prerequisiteLevelId; }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      sortOrder: this.sortOrder,
      prerequisiteLevelId: this.prerequisiteLevelId
    };
  }
}

export default LevelSummary;
