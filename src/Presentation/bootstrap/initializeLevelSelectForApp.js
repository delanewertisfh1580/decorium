import LevelSelectView from '../Views/LevelSelectView.js';

export async function initializeLevelSelectForApp({
  listAuthoredLevelsUseCase,
  savePlayerProfileUseCase,
  gameController,
  profile,
  levelSelectContainer,
  timestampProvider
}) {
  if (!listAuthoredLevelsUseCase || typeof listAuthoredLevelsUseCase.execute !== 'function') {
    throw new Error('initializeLevelSelectForApp: listAuthoredLevelsUseCase is required.');
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

  const catalog = await listAuthoredLevelsUseCase.execute();
  if (!catalog.success) throw new Error(catalog.error);
  if (catalog.data.length === 0) throw new Error('LEVEL_CATALOG_EMPTY: At least one authored level is required.');

  let currentProfile = profile;
  let activeLevelId = catalog.data.some(level => level.id === profile.lastSession.levelId)
    ? profile.lastSession.levelId
    : catalog.data[0].id;
  let levelSelectView;

  const selectLevel = async levelId => {
    if (!catalog.data.some(level => level.id === levelId)) {
      throw new Error(`UNKNOWN_LEVEL: ${levelId}`);
    }

    await gameController.loadLevel(levelId);
    const nextProfile = currentProfile.withLastSession(levelId, timestampProvider());
    const saved = await savePlayerProfileUseCase.execute(nextProfile);
    if (!saved.success) throw new Error(saved.error);

    currentProfile = saved.data;
    activeLevelId = levelId;
    levelSelectView.render(catalog.data, activeLevelId);
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
