import { afterEach, describe, expect, it, vi } from 'vitest';
import BuildInfo from '../../src/Operations/Release/BuildInfo.js';
import JsonReleaseManifestRepository from '../../src/Infrastructure/Repositories/JsonReleaseManifestRepository.js';

const manifest = {
  schemaVersion: 1,
  application: 'decorium',
  releaseVersion: '1.0.0',
  sourceRevision: '9e49e788ecf335a8f87f38486c08ed5a8e7f6ce1',
  channel: 'web',
  builtAt: '2026-08-14T18:30:00.000Z'
};

afterEach(() => vi.unstubAllGlobals());

describe('JsonReleaseManifestRepository', () => {
  it('loads a release manifest from its configured path and validates it into BuildInfo', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => manifest });
    vi.stubGlobal('fetch', fetch);
    const repository = new JsonReleaseManifestRepository('/release-manifest.json');

    const result = await repository.load();

    expect(fetch).toHaveBeenCalledWith('/release-manifest.json');
    expect(result).toBeInstanceOf(BuildInfo);
    expect(result.toJSON()).toEqual(manifest);
  });

  it.each([
    [{ ok: false, status: 404 }],
    [{ ok: true, json: async () => ({ ...manifest, schemaVersion: 2 }) }]
  ])('rejects unavailable or invalid manifest data %#', async response => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const repository = new JsonReleaseManifestRepository();

    await expect(repository.load()).rejects.toThrow();
  });
});
