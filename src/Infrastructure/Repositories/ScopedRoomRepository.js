import InMemoryRoomRepository from './InMemoryRoomRepository.js';

function requireId(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string.`);
  return value.trim();
}

/** Runtime RoomState repository with an optional profile/level-scoped durable snapshot mirror. */
export class ScopedRoomRepository {
  constructor({ sessionRepository = new InMemoryRoomRepository(), roomDesignRepository = null } = {}) {
    if (!sessionRepository || typeof sessionRepository.getState !== 'function' || typeof sessionRepository.saveState !== 'function') {
      throw new Error('ScopedRoomRepository: sessionRepository must implement getState and saveState.');
    }
    this.sessionRepository = sessionRepository;
    this.roomDesignRepository = roomDesignRepository;
    this.scopes = new Map();
  }

  associate(roomId, { profileId, levelId, baselineRoomState = null }) {
    const baseline = baselineRoomState && typeof baselineRoomState.clone === 'function' ? baselineRoomState.clone() : null;
    this.scopes.set(requireId(roomId, 'roomId'), Object.freeze({
      persistent: true,
      profileId: requireId(profileId, 'profileId'),
      levelId: requireId(levelId, 'levelId'),
      baselineRoomState: baseline
    }));
  }

  registerEphemeral(roomId, baselineRoomState) {
    const baseline = baselineRoomState && typeof baselineRoomState.clone === 'function' ? baselineRoomState.clone() : null;
    if (!baseline) throw new Error('ScopedRoomRepository: ephemeral baselineRoomState is required.');
    this.scopes.set(requireId(roomId, 'roomId'), Object.freeze({
      persistent: false,
      profileId: null,
      levelId: null,
      baselineRoomState: baseline
    }));
  }

  getBaselineState(roomId) {
    const baseline = this.scopes.get(roomId)?.baselineRoomState;
    return baseline?.clone ? baseline.clone() : null;
  }

  async getState(roomId) { return this.sessionRepository.getState(roomId); }
  async loadRoomState(roomId) { return this.getState(roomId); }

  async saveState(roomId, roomState) {
    const saved = await this.sessionRepository.saveState(roomId, roomState);
    if (!saved) return false;
    const scope = this.scopes.get(roomId);
    if (!scope?.persistent || !this.roomDesignRepository) return true;
    return this.roomDesignRepository.save(scope.profileId, scope.levelId, roomState);
  }

  async saveRoomState(roomId, roomState) { return this.saveState(roomId, roomState); }
}

export default ScopedRoomRepository;
