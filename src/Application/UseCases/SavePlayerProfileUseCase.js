import PlayerProfile from '../../Domain/Profile/PlayerProfile.js';

export class SavePlayerProfileUseCase {
  constructor(profileRepository) {
    if (!profileRepository || typeof profileRepository.save !== 'function') {
      throw new Error('SavePlayerProfileUseCase: profileRepository with save method is required.');
    }
    this.profileRepository = profileRepository;
  }

  async execute(profile) {
    if (!(profile instanceof PlayerProfile)) {
      return { success: false, error: 'INVALID_PROFILE: PlayerProfile domain object is required.' };
    }

    try {
      const saved = await this.profileRepository.save(profile);
      if (!saved) {
        return { success: false, error: 'PERSISTENCE_ERROR: Failed to save player profile.' };
      }
      return { success: true, data: profile };
    } catch (error) {
      return { success: false, error: `PERSISTENCE_ERROR: ${error.message}` };
    }
  }
}

export default SavePlayerProfileUseCase;
