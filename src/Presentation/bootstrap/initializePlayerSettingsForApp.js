import PlayerSettingsView from '../Views/PlayerSettingsView.js';

function applyPlayerSettings({ appRoot, gameController, profile }) {
  appRoot.dataset.reducedMotion = String(profile.settings.reducedMotion);
  appRoot.dataset.uiScale = profile.settings.uiScale;
  appRoot.dataset.qualityTier = profile.settings.qualityTier;
  gameController.setPlayerProfile(profile);
  gameController.setPlayerSettings(profile.settings);
}

export async function initializePlayerSettingsForApp({
  updatePlayerSettingsUseCase,
  gameController,
  profile,
  settingsContainer,
  appRoot
}) {
  if (!updatePlayerSettingsUseCase || typeof updatePlayerSettingsUseCase.execute !== 'function') {
    throw new Error('initializePlayerSettingsForApp: updatePlayerSettingsUseCase is required.');
  }
  if (!gameController || typeof gameController.setPlayerProfile !== 'function' || typeof gameController.setPlayerSettings !== 'function') {
    throw new Error('initializePlayerSettingsForApp: gameController settings methods are required.');
  }
  if (!profile) throw new Error('initializePlayerSettingsForApp: profile is required.');
  if (!settingsContainer) throw new Error('initializePlayerSettingsForApp: settingsContainer is required.');
  if (!appRoot) throw new Error('initializePlayerSettingsForApp: appRoot is required.');

  let currentProfile = profile;
  let settingsView;
  const requestSettingsUpdate = async changes => {
    const result = await updatePlayerSettingsUseCase.execute(currentProfile, changes);
    if (!result.success) throw new Error(result.error);
    currentProfile = result.data;
    applyPlayerSettings({ appRoot, gameController, profile: currentProfile });
    settingsView.render(currentProfile.settings);
  };

  settingsView = new PlayerSettingsView(settingsContainer, changes => {
    requestSettingsUpdate(changes).catch(error => console.error('Decorium settings update error:', error));
  });
  applyPlayerSettings({ appRoot, gameController, profile: currentProfile });
  settingsView.render(currentProfile.settings);

  return { profile: currentProfile, view: settingsView };
}

export default initializePlayerSettingsForApp;
