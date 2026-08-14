const PROFILE_SCHEMA_VERSION = 1;

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`PlayerProfile ${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireIsoTimestamp(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`PlayerProfile ${label} must be an ISO timestamp`);
  }
  return value;
}

function normalizeDisplayName(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new Error('PlayerProfile displayName must be a string or null');
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeSettings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('PlayerProfile settings must be an object');
  }
  if (typeof value.reducedMotion !== 'boolean') {
    throw new Error('PlayerProfile settings.reducedMotion must be a boolean');
  }
  return Object.freeze({ reducedMotion: value.reducedMotion });
}

function normalizeLastSession(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('PlayerProfile lastSession must be an object');
  }
  const { levelId } = value;
  if (levelId !== null && levelId !== undefined && (typeof levelId !== 'string' || levelId.trim() === '')) {
    throw new Error('PlayerProfile lastSession.levelId must be a non-empty string or null');
  }
  return Object.freeze({ levelId: typeof levelId === 'string' ? levelId.trim() : null });
}

export class PlayerProfile {
  static get schemaVersion() {
    return PROFILE_SCHEMA_VERSION;
  }

  static create({ profileId, timestamp }) {
    return new PlayerProfile({
      schemaVersion: PROFILE_SCHEMA_VERSION,
      profileId,
      createdAt: timestamp,
      updatedAt: timestamp,
      displayName: null,
      settings: { reducedMotion: false },
      lastSession: { levelId: null }
    });
  }

  static fromData(data) {
    return new PlayerProfile(data);
  }

  constructor({ schemaVersion, profileId, createdAt, updatedAt, displayName, settings, lastSession }) {
    if (schemaVersion !== PROFILE_SCHEMA_VERSION) {
      throw new Error(`Unsupported PlayerProfile schema version: ${schemaVersion}`);
    }

    this._schemaVersion = PROFILE_SCHEMA_VERSION;
    this._profileId = requireNonEmptyString(profileId, 'profileId');
    this._createdAt = requireIsoTimestamp(createdAt, 'createdAt');
    this._updatedAt = requireIsoTimestamp(updatedAt, 'updatedAt');
    this._displayName = normalizeDisplayName(displayName);
    this._settings = normalizeSettings(settings);
    this._lastSession = normalizeLastSession(lastSession);
    Object.freeze(this);
  }

  get schemaVersion() { return this._schemaVersion; }
  get profileId() { return this._profileId; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }
  get displayName() { return this._displayName; }
  get settings() { return this._settings; }
  get lastSession() { return this._lastSession; }

  withReducedMotion(reducedMotion, updatedAt) {
    if (typeof reducedMotion !== 'boolean') {
      throw new Error('PlayerProfile reducedMotion must be a boolean');
    }
    return this._copy({
      settings: { reducedMotion },
      updatedAt
    });
  }

  withLastSession(levelId, updatedAt) {
    return this._copy({
      lastSession: { levelId },
      updatedAt
    });
  }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      profileId: this.profileId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      displayName: this.displayName,
      settings: { ...this.settings },
      lastSession: { ...this.lastSession }
    };
  }

  _copy(overrides) {
    return new PlayerProfile({
      ...this.toJSON(),
      ...overrides
    });
  }
}

export default PlayerProfile;
