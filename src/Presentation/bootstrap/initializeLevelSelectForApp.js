import LevelSelectView from '../Views/LevelSelectView.js';

export async function initializeLevelSelectForApp({
  getCampaignLevelsUseCase,
  savePlayerProfileUseCase,
  gameController,
  profile,
  levelSelectContainer,
  timestampProvider
}) {
  if (!getCampaignLevelsUseCase || typeof getCampaignLevelsUseCase.execute !== 'function') {
    throw new Error('initializeLevelSelectForApp: getCampaignLevelsUseCase is required.');
  }
  if (!savePlayerProfileUseCase || typeof savePlayerProfileUseCase.execute !== 'function') {
    throw new Error('initializeLevelSelectForApp: savePlayerProfileUseCase is required.');
  }
  if (!gameController || typeof gameController.loadLevel !== 'function') {
    throw new Error('initializeLevelSelectForApp: gameController with loadLevel is required.');
  }
  if (!profile) throw new Error('initializeLevelSelectForApp: profile is required.');
  if (!levelSelectContainer) throw new Error('initializeLevelSelectForApp: levelSelectContainer is required.');
  if (typeof timestampProvider !== 'function') {
    throw new Error('initializeLevelSelectForApp: timestampProvider is required.');
  }

  const campaign = await getCampaignLevelsUseCase.execute(profile);
  if (!campaign.success) throw new Error(campaign.error);
  if (campaign.data.length === 0) throw new Error('LEVEL_CATALOG_EMPTY: At least one authored level is required.');

  const unlockedLevels = campaign.data.filter(level => level.isUnlocked !== false);
  if (unlockedLevels.length === 0) throw new Error('CAMPAIGN_NO_UNLOCKED_LEVEL: At least one level must be unlocked.');

  let currentProfile = profile;
  let activeLevelId = unlockedLevels.some(level => level.id === profile.lastSession.levelId)
    ? profile.lastSession.levelId
    : unlockedLevels[0].id;
  let levelSelectView;

  const selectLevel = async levelId => {
    currentProfile = gameController.playerProfile ?? currentProfile;
    if (!campaign.data.some(level => level.id === levelId && level.isUnlocked !== false)) {
      throw new Error(`UNKNOWN_OR_LOCKED_LEVEL: ${levelId}`);
    }

    await gameController.loadLevel(levelId);
    const nextProfile = currentProfile.withLastSession(levelId, timestampProvider());
    const saved = await savePlayerProfileUseCase.execute(nextProfile);
    if (!saved.success) throw new Error(saved.error);

    currentProfile = saved.data;
    activeLevelId = levelId;
    levelSelectView.render(campaign.data, activeLevelId);
  };

  levelSelectView = new LevelSelectView(levelSelectContainer, levelId => {
    selectLevel(levelId).catch(error => console.error('Decorium level selection error:', error));
  });

  await selectLevel(activeLevelId);

  return {
    activeLevelId,
    profile: currentProfile
  };
}
