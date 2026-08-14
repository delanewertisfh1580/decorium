// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { initializeReleaseInfoForApp } from '../../src/Presentation/bootstrap/initializeReleaseInfoForApp.js';

const buildInfo = {
  releaseVersion: '1.0.0',
  sourceRevision: '9e49e788ecf335a8f87f38486c08ed5a8e7f6ce1',
  channel: 'web'
};

describe('initializeReleaseInfoForApp', () => {
  it('renders the available validated release identity', async () => {
    const container = document.createElement('aside');
    const getBuildInfoUseCase = { execute: vi.fn().mockResolvedValue({ success: true, data: buildInfo }) };

    const result = await initializeReleaseInfoForApp({ getBuildInfoUseCase, releaseInfoContainer: container });

    expect(result).toEqual({ success: true, data: buildInfo });
    expect(container.textContent).toContain('9e49e78');
  });

  it('renders unavailable information and allows app bootstrap to continue on manifest failure', async () => {
    const container = document.createElement('aside');

    const result = await initializeReleaseInfoForApp({
      getBuildInfoUseCase: { execute: vi.fn().mockResolvedValue({ success: false, error: 'BUILD_INFO_UNAVAILABLE' }) },
      releaseInfoContainer: container
    });

    expect(result).toEqual({ success: false, error: 'BUILD_INFO_UNAVAILABLE' });
    expect(container.textContent).toContain('Сведения о версии недоступны');
  });
});
