import MainMenuView from '../Views/MainMenuView.js';

function normalizedSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error('ENDLESS_SEED_INVALID: Expected an unsigned 32-bit integer.');
  }
  return seed;
}

export async function initializeMainMenuForApp({
  getCampaignLevelsUseCase,
  savePlayerProfileUseCase,
  gameController,
  profile,
  mainMenuContainer,
  timestampProvider,
  seedProvider
} = {}) {
  if (!getCampaignLevelsUseCase?.execute) throw new Error('initializeMainMenuForApp: getCampaignLevelsUseCase is required.');
  if (!savePlayerProfileUseCase?.execute) throw new Error('initializeMainMenuForApp: savePlayerProfileUseCase is required.');
  if (!gameController?.loadLevel || !gameController?.loadEndlessRun) throw new Error('initializeMainMenuForApp: GameController level commands are required.');
  if (!profile) throw new Error('initializeMainMenuForApp: profile is required.');
  if (!mainMenuContainer) throw new Error('initializeMainMenuForApp: mainMenuContainer is required.');
  if (typeof timestampProvider !== 'function' || typeof seedProvider !== 'function') {
    throw new Error('initializeMainMenuForApp: timestampProvider and seedProvider are required.');
  }

  let currentProfile = profile;
  let campaignLevels = [];
  let activeLevelId = null;
  let endlessSeed = null;
  let screen = 'home';

  const loadCampaign = async () => {
    const result = await getCampaignLevelsUseCase.execute(currentProfile);
    if (!result.success) throw new Error(result.error);
    campaignLevels = result.data;
    const unlocked = campaignLevels.filter(level => level.isUnlocked !== false);
    if (unlocked.length === 0) throw new Error('CAMPAIGN_NO_UNLOCKED_LEVEL: At least one level must be unlocked.');
    if (!unlocked.some(level => level.id === activeLevelId)) activeLevelId = unlocked[0].id;
    return campaignLevels;
  };

  const isContinueAvailable = () => campaignLevels.some(level => (
    level.id === currentProfile.lastSession.levelId && level.isUnlocked !== false
  ));
  const render = () => view.render({
    screen,
    campaignLevels,
    activeLevelId,
    continueLevelId: isContinueAvailable() ? currentProfile.lastSession.levelId : null,
    endlessSeed,
    profile: currentProfile
  });

  const beginCampaign = async levelId => {
    if (!campaignLevels.some(level => level.id === levelId && level.isUnlocked !== false)) {
      throw new Error(`UNKNOWN_OR_LOCKED_LEVEL: ${levelId}`);
    }
    await gameController.loadLevel(levelId);
    const updated = currentProfile.withLastSession(levelId, timestampProvider());
    const saved = await savePlayerProfileUseCase.execute(updated);
    if (!saved.success) throw new Error(saved.error);
    currentProfile = saved.data;
    activeLevelId = levelId;
    gameController.setPlayerProfile?.(currentProfile);
    view.hide();
  };

  const beginEndless = async requestedSeed => {
    const seed = requestedSeed === null ? normalizedSeed(seedProvider()) : normalizedSeed(requestedSeed);
    await gameController.loadEndlessRun(seed);
    endlessSeed = seed;
    view.hide();
  };

  const safely = callback => () => callback().catch(error => {
    console.error('Decorium main menu error:', error);
    gameController.showStatus?.(error.message);
  });

  const view = new MainMenuView(mainMenuContainer, {
    onContinue: safely(() => beginCampaign(currentProfile.lastSession.levelId)),
    onCampaign: safely(async () => { screen = 'campaign'; render(); }),
    onEndless: safely(async () => { screen = 'endless'; render(); }),
    onBack: safely(async () => { screen = 'home'; render(); }),
    onSelectLevel: levelId => safely(() => beginCampaign(levelId))(),
    onStartEndless: seed => safely(() => beginEndless(seed))()
  });

  await loadCampaign();
  render();

  const show = async () => {
    await loadCampaign();
    screen = 'home';
    render();
  };
  const refresh = async updatedProfile => {
    if (!updatedProfile) throw new Error('initializeMainMenuForApp: updated profile is required.');
    currentProfile = updatedProfile;
    await loadCampaign();
    if (view.isVisible) render();
    return campaignLevels;
  };

  return { profile: currentProfile, refresh, show, destroy: () => view.destroy() };
}

export default initializeMainMenuForApp;
