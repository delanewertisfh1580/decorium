export class LoadPlayerProfileUseCase {
  constructor(profileRepository, profileFactory) {
    if (!profileRepository) {
      throw new Error('LoadPlayerProfileUseCase: profileRepository is required.');
    }
    if (!profileFactory) {
      throw new Error('LoadPlayerProfileUseCase: profileFactory is required.');
    }
    if (typeof profileRepository.load !== 'function' || typeof profileRepository.save !== 'function') {
      throw new Error('LoadPlayerProfileUseCase: profileRepository must expose load and save methods.');
    }
    if (typeof profileFactory.create !== 'function') {
      throw new Error('LoadPlayerProfileUseCase: profileFactory must expose a create method.');
    }

    this.profileRepository = profileRepository;
    this.profileFactory = profileFactory;
  }

  async execute() {
    try {
      const restored = await this.profileRepository.load();
      if (restored?.profile) {
        return {
          success: true,
          status: restored.status ?? 'restored',
          data: restored.profile
        };
      }

      const profile = this.profileFactory.create();
      const saved = await this.profileRepository.save(profile);
      if (!saved) {
        return { success: false, error: 'PERSISTENCE_ERROR: Failed to save player profile.' };
      }

      return {
        success: true,
        status: restored?.status === 'recovered' ? 'recovered' : 'created',
        data: profile
      };
    } catch (error) {
      return { success: false, error: `PERSISTENCE_ERROR: ${error.message}` };
    }
  }
}

export default LoadPlayerProfileUseCase;
