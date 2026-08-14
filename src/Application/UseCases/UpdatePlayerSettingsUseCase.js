import PlayerProfile from '../../Domain/Profile/PlayerProfile.js';
import PlayerSettings from '../../Domain/Profile/PlayerSettings.js';

export class UpdatePlayerSettingsUseCase {
  constructor(savePlayerProfileUseCase, timestampProvider) {
    if (!savePlayerProfileUseCase || typeof savePlayerProfileUseCase.execute !== 'function') {
      throw new Error('UpdatePlayerSettingsUseCase: savePlayerProfileUseCase is required.');
    }
    if (typeof timestampProvider !== 'function') {
      throw new Error('UpdatePlayerSettingsUseCase: timestampProvider is required.');
    }
    this.savePlayerProfileUseCase = savePlayerProfileUseCase;
    this.timestampProvider = timestampProvider;
  }

  async execute(profile, changes) {
    if (!(profile instanceof PlayerProfile)) {
      return { success: false, error: 'INVALID_PROFILE: PlayerProfile domain object is required.' };
    }

    let settings;
    try {
      settings = PlayerSettings.fromData(profile.settings).withChanges(changes);
    } catch (_error) {
      return { success: false, error: 'INVALID_SETTINGS: Unsupported player settings.' };
    }

    const updatedProfile = profile.withSettings(settings, this.timestampProvider());
    return this.savePlayerProfileUseCase.execute(updatedProfile);
  }
}

export default UpdatePlayerSettingsUseCase;
