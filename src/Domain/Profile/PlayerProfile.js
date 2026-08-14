import PlayerSettings from './PlayerSettings.js';

const PROFILE_SCHEMA_VERSION = 3;

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
  if (value instanceof PlayerSettings) return value;
  return PlayerSettings.fromData(value);
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

function normalizeProgress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !value.completedLevels || typeof value.completedLevels !== 'object' || Array.isArray(value.completedLevels)) {
    throw new Error('PlayerProfile progress.completedLevels must be an object');
  }

  const completedLevels = {};
  for (const [levelId, completion] of Object.entries(value.completedLevels)) {
    const normalizedLevelId = requireNonEmptyString(levelId, 'progress levelId');
    if (!completion || typeof completion !== 'object' || Array.isArray(completion)) {
      throw new Error(`PlayerProfile progress for ${normalizedLevelId} must be an object`);
    }
    if (!Number.isInteger(completion.bestStars) || completion.bestStars < 0 || completion.bestStars > 5) {
      throw new Error(`PlayerProfile progress bestStars for ${normalizedLevelId} must be an integer between 0 and 5`);
    }
    completedLevels[normalizedLevelId] = Object.freeze({
      bestStars: completion.bestStars,
      completedAt: requireIsoTimestamp(completion.completedAt, `progress completedAt for ${normalizedLevelId}`)
    });
  }
  return Object.freeze({ completedLevels: Object.freeze(completedLevels) });
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
      settings: PlayerSettings.createDefault().toJSON(),
      lastSession: { levelId: null },
      progress: { completedLevels: {} }
    });
  }

  static fromData(data) {
    return new PlayerProfile(data);
  }

  constructor({ schemaVersion, profileId, createdAt, updatedAt, displayName, settings, lastSession, progress }) {
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
    this._progress = normalizeProgress(progress);
    Object.freeze(this);
  }

  get schemaVersion() { return this._schemaVersion; }
  get profileId() { return this._profileId; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }
  get displayName() { return this._displayName; }
  get settings() { return this._settings.toJSON(); }
  get lastSession() { return this._lastSession; }
  get progress() { return this._progress; }

  withReducedMotion(reducedMotion, updatedAt) {
    return this.withSettings(this._settings.withChanges({ reducedMotion }), updatedAt);
  }

  withSettings(settings, updatedAt) {
    if (!(settings instanceof PlayerSettings)) {
      throw new Error('PlayerProfile settings must be a PlayerSettings domain object');
    }
    return this._copy({
      settings: settings.toJSON(),
      updatedAt
    });
  }

  withLastSession(levelId, updatedAt) {
    return this._copy({
      lastSession: { levelId },
      updatedAt
    });
  }

  recordLevelCompletion({ levelId, stars, updatedAt }) {
    const normalizedLevelId = requireNonEmptyString(levelId, 'completion levelId');
    if (!Number.isInteger(stars) || stars < 0 || stars > 5) {
      throw new Error('PlayerProfile completion stars must be an integer between 0 and 5');
    }
    const timestamp = requireIsoTimestamp(updatedAt, 'completion updatedAt');
    const previous = this.progress.completedLevels[normalizedLevelId];
    const bestStars = Math.max(previous?.bestStars ?? 0, stars);

    return this._copy({
      updatedAt: timestamp,
      progress: {
        completedLevels: {
          ...this.progress.completedLevels,
          [normalizedLevelId]: { bestStars, completedAt: timestamp }
        }
      }
    });
  }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      profileId: this.profileId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      displayName: this.displayName,
      settings: this.settings,
      lastSession: { ...this.lastSession },
      progress: {
        completedLevels: Object.fromEntries(
          Object.entries(this.progress.completedLevels).map(([levelId, completion]) => [levelId, { ...completion }])
        )
      }
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
