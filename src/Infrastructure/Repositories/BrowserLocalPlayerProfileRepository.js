import PlayerProfile from '../../Domain/Profile/PlayerProfile.js';

const DEFAULT_STORAGE_KEY = 'decorium.player-profile';

function migrateToCurrent(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Persisted player profile must be an object');
  }

  if (data.schemaVersion === PlayerProfile.schemaVersion) {
    return { data, migrated: false };
  }

  if (data.schemaVersion === 0) {
    return {
      migrated: true,
      data: {
        schemaVersion: PlayerProfile.schemaVersion,
        profileId: data.profileId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        displayName: data.displayName ?? null,
        settings: { reducedMotion: Boolean(data.reducedMotion) },
        lastSession: { levelId: data.lastLevelId ?? null }
      }
    };
  }

  throw new Error(`Unsupported persisted PlayerProfile schema version: ${data.schemaVersion}`);
}

export class BrowserLocalPlayerProfileRepository {
  constructor(storage, storageKey = DEFAULT_STORAGE_KEY) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
      throw new Error('BrowserLocalPlayerProfileRepository: storage must implement getItem, setItem and removeItem.');
    }
    if (typeof storageKey !== 'string' || storageKey.trim() === '') {
      throw new Error('BrowserLocalPlayerProfileRepository: storageKey must be a non-empty string.');
    }
    this.storage = storage;
    this.storageKey = storageKey.trim();
  }

  async load() {
    try {
      const serialized = this.storage.getItem(this.storageKey);
      if (serialized === null || serialized === undefined || serialized === '') {
        return { profile: null, status: 'missing' };
      }

      const parsed = JSON.parse(serialized);
      const { data, migrated } = migrateToCurrent(parsed);
      const profile = PlayerProfile.fromData(data);
      if (migrated && !await this.save(profile)) {
        throw new Error('Failed to persist migrated player profile');
      }
      return { profile, status: migrated ? 'migrated' : 'restored' };
    } catch (_error) {
      this._removeCorruptProfile();
      return { profile: null, status: 'recovered' };
    }
  }

  async save(profile) {
    if (!(profile instanceof PlayerProfile)) return false;
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(profile.toJSON()));
      return true;
    } catch (_error) {
      return false;
    }
  }

  _removeCorruptProfile() {
    try {
      this.storage.removeItem(this.storageKey);
    } catch (_error) {
      // Recovery is best-effort: lack of browser storage must never crash bootstrap.
    }
  }
}

export default BrowserLocalPlayerProfileRepository;
