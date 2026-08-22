function getState(repository, roomId) {
  return repository.getState ? repository.getState(roomId) : repository.loadRoomState(roomId);
}

function saveState(repository, roomId, state) {
  return repository.saveState ? repository.saveState(roomId, state) : repository.saveRoomState(roomId, state);
}

export class ConfigurePlacedItemUseCase {
  constructor(roomRepository, getPlayerProfile = () => null) {
    if (!roomRepository) throw new Error('ConfigurePlacedItemUseCase: roomRepository is required.');
    if (typeof getPlayerProfile !== 'function') throw new Error('ConfigurePlacedItemUseCase: getPlayerProfile must be a function.');
    this.roomRepository = roomRepository;
    this.getPlayerProfile = getPlayerProfile;
  }

  async execute(roomId, instanceId, configuration) {
    if (typeof roomId !== 'string' || roomId.trim() === '' || typeof instanceId !== 'string' || instanceId.trim() === '') {
      return Object.freeze({ success: false, error: 'INVALID_INPUT' });
    }
    try {
      const state = await getState(this.roomRepository, roomId);
      if (!state) return Object.freeze({ success: false, error: 'ROOM_NOT_FOUND' });
      const placed = state.getItem(instanceId);
      if (!placed) return Object.freeze({ success: false, error: 'NOT_FOUND' });
      const variantId = configuration?.variantId ?? placed.item.baseVariantId;
      const variant = variantId === null ? null : placed.item.getVariant(variantId);
      if (variantId !== null && !variant) return Object.freeze({ success: false, error: 'UNKNOWN_VARIANT' });
      const profile = this.getPlayerProfile();
      if (variant && (!profile || typeof profile.hasUnlock !== 'function' || !profile.hasUnlock(variant.unlockId))) {
        return Object.freeze({ success: false, error: 'VARIANT_LOCKED' });
      }
      const result = state.configureItem(instanceId, configuration);
      if (!result.success) return Object.freeze({ success: false, error: result.error });
      if (!await saveState(this.roomRepository, roomId, state)) return Object.freeze({ success: false, error: 'PERSISTENCE_ERROR' });
      return Object.freeze({ success: true, data: result.data });
    } catch (error) {
      console.error(`ConfigurePlacedItemUseCase: Error configuring ${instanceId}:`, error);
      return Object.freeze({ success: false, error: `UNEXPECTED_ERROR: ${error.message}` });
    }
  }
}

export default ConfigurePlacedItemUseCase;
