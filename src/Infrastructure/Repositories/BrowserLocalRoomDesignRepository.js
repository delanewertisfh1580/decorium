const SCHEMA_VERSION = 1;
const DEFAULT_STORAGE_KEY = 'decorium.room-designs';

function requireId(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string.`);
  return value.trim();
}

function parseCatalog(serialized) {
  if (serialized === null || serialized === undefined || serialized === '') return {};
  const parsed = JSON.parse(serialized);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Persisted room designs must be an object.');
  return parsed;
}

function entryKey(profileId, levelId) {
  return `${requireId(profileId, 'profileId')}::${requireId(levelId, 'levelId')}`;
}

function validSnapshot(snapshot) {
  return snapshot && typeof snapshot === 'object' && snapshot.schemaVersion === 2
    && snapshot.bounds && Number.isFinite(snapshot.bounds.width) && Number.isFinite(snapshot.bounds.depth)
    && Array.isArray(snapshot.items);
}

/** Persists only serialized RoomState snapshots; catalog hydration remains an Application concern. */
export class BrowserLocalRoomDesignRepository {
  constructor(storage, storageKey = DEFAULT_STORAGE_KEY) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
      throw new Error('BrowserLocalRoomDesignRepository: storage must implement getItem, setItem and removeItem.');
    }
    this.storage = storage;
    this.storageKey = requireId(storageKey, 'storageKey');
  }

  async load(profileId, levelId) {
    try {
      const catalog = parseCatalog(this.storage.getItem(this.storageKey));
      const entry = catalog[entryKey(profileId, levelId)];
      if (!entry || entry.schemaVersion !== SCHEMA_VERSION || !validSnapshot(entry.roomState)) return null;
      return structuredClone(entry.roomState);
    } catch (_error) {
      return null;
    }
  }

  async save(profileId, levelId, roomState) {
    if (!roomState || typeof roomState.serialize !== 'function') return false;
    try {
      const snapshot = roomState.serialize();
      if (!validSnapshot(snapshot)) return false;
      const catalog = parseCatalog(this.storage.getItem(this.storageKey));
      catalog[entryKey(profileId, levelId)] = {
        schemaVersion: SCHEMA_VERSION,
        roomState: snapshot,
        updatedAt: new Date().toISOString()
      };
      this.storage.setItem(this.storageKey, JSON.stringify(catalog));
      return true;
    } catch (_error) {
      return false;
    }
  }

  async remove(profileId, levelId) {
    try {
      const catalog = parseCatalog(this.storage.getItem(this.storageKey));
      delete catalog[entryKey(profileId, levelId)];
      this.storage.setItem(this.storageKey, JSON.stringify(catalog));
      return true;
    } catch (_error) {
      return false;
    }
  }
}

export default BrowserLocalRoomDesignRepository;
