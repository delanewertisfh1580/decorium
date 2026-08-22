const BUILD_INFO_SCHEMA_VERSION = 1;
const GIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const CHANNELS = new Set(['web', 'pwa']);

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`BuildInfo ${label} must be a non-empty string`);
  return value.trim();
}

function requireTimestamp(value) {
  const timestamp = requireString(value, 'builtAt');
  if (Number.isNaN(Date.parse(timestamp))) throw new Error('BuildInfo builtAt must be an ISO timestamp');
  return timestamp;
}

export default class BuildInfo {
  static fromData(data) {
    return new BuildInfo(data);
  }

  constructor({ schemaVersion, application, releaseVersion, sourceRevision, channel, builtAt }) {
    if (schemaVersion !== BUILD_INFO_SCHEMA_VERSION) {
      throw new Error(`Unsupported BuildInfo schema version: ${schemaVersion}`);
    }
    if (application !== 'decorium') throw new Error('BuildInfo application must be decorium');
    if (!SEMVER_PATTERN.test(requireString(releaseVersion, 'releaseVersion'))) {
      throw new Error('BuildInfo releaseVersion must be semantic versioning');
    }
    if (!GIT_SHA_PATTERN.test(requireString(sourceRevision, 'sourceRevision'))) {
      throw new Error('BuildInfo sourceRevision must be a 40-character lowercase Git SHA');
    }
    if (!CHANNELS.has(channel)) throw new Error(`BuildInfo channel must be one of: ${[...CHANNELS].join(', ')}`);

    this.schemaVersion = schemaVersion;
    this.application = application;
    this.releaseVersion = releaseVersion;
    this.sourceRevision = sourceRevision;
    this.channel = channel;
    this.builtAt = requireTimestamp(builtAt);
    Object.freeze(this);
  }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      application: this.application,
      releaseVersion: this.releaseVersion,
      sourceRevision: this.sourceRevision,
      channel: this.channel,
      builtAt: this.builtAt
    };
  }
}

export { BUILD_INFO_SCHEMA_VERSION };
