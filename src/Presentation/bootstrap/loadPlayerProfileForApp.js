import ProfileStatusView from '../Views/ProfileStatusView.js';

export async function loadPlayerProfileForApp({ loadPlayerProfileUseCase, profileContainer, appRoot }) {
  if (!loadPlayerProfileUseCase || typeof loadPlayerProfileUseCase.execute !== 'function') {
    throw new Error('loadPlayerProfileForApp: loadPlayerProfileUseCase is required.');
  }
  if (!profileContainer) throw new Error('loadPlayerProfileForApp: profileContainer is required.');
  if (!appRoot) throw new Error('loadPlayerProfileForApp: appRoot is required.');

  const result = await loadPlayerProfileUseCase.execute();
  if (!result.success) throw new Error(result.error);

  const statusView = new ProfileStatusView(profileContainer);
  statusView.render({ status: result.status, profile: result.data });
  appRoot.dataset.reducedMotion = String(result.data.settings.reducedMotion);

  return result.data;
}
