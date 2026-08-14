import { describe, expect, it, vi } from 'vitest';
import BuildInfo from '../../../src/Domain/Release/BuildInfo.js';
import GetBuildInfoUseCase from '../../../src/Application/UseCases/GetBuildInfoUseCase.js';

const buildInfo = BuildInfo.fromData({
  schemaVersion: 1,
  application: 'decorium',
  releaseVersion: '1.0.0',
  sourceRevision: '9e49e788ecf335a8f87f38486c08ed5a8e7f6ce1',
  channel: 'web',
  builtAt: '2026-08-14T18:30:00.000Z'
});

describe('GetBuildInfoUseCase', () => {
  it('returns the validated release identity supplied by its manifest port', async () => {
    const releaseManifestRepository = { load: vi.fn().mockResolvedValue(buildInfo) };
    const useCase = new GetBuildInfoUseCase(releaseManifestRepository);

    await expect(useCase.execute()).resolves.toEqual({ success: true, data: buildInfo });
    expect(releaseManifestRepository.load).toHaveBeenCalledOnce();
  });

  it('returns an actionable failure without leaking infrastructure error details', async () => {
    const useCase = new GetBuildInfoUseCase({ load: vi.fn().mockRejectedValue(new Error('fetch failed: internal host')) });

    await expect(useCase.execute()).resolves.toEqual({ success: false, error: 'BUILD_INFO_UNAVAILABLE' });
  });
});
