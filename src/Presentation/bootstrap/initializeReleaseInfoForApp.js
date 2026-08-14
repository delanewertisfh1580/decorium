import ReleaseInfoView from '../Views/ReleaseInfoView.js';

export async function initializeReleaseInfoForApp({ getBuildInfoUseCase, releaseInfoContainer }) {
  if (!getBuildInfoUseCase || typeof getBuildInfoUseCase.execute !== 'function') {
    throw new Error('initializeReleaseInfoForApp: getBuildInfoUseCase is required.');
  }
  const view = new ReleaseInfoView(releaseInfoContainer);
  const result = await getBuildInfoUseCase.execute();
  if (result.success) view.renderAvailable(result.data);
  else view.renderUnavailable();
  return result;
}

export default initializeReleaseInfoForApp;
