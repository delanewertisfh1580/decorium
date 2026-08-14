import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonLevelRepository } from '../../src/Infrastructure/Repositories/JsonLevelRepository.js';

const manifest = {
  schemaVersion: 1,
  levels: [
    { id: 'level-002', name: 'Тёплый уголок', description: 'Соберите уютную зону отдыха.', sortOrder: 2 },
    { id: 'level-001', name: 'Первые шаги', description: 'Освойте основу композиции.', sortOrder: 1 }
  ]
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('JsonLevelRepository.listLevels', () => {
  it('loads authored level summaries from the versioned static manifest', async () => {
    const fetch = vi.fn(async () => ({ ok: true, json: async () => manifest }));
    vi.stubGlobal('fetch', fetch);
    const repository = new JsonLevelRepository('/levels');

    await expect(repository.listLevels()).resolves.toEqual(manifest.levels);
    expect(fetch).toHaveBeenCalledWith('/levels/manifest.json');
  });

  it('rejects a manifest with an unsupported version or missing level collection', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ schemaVersion: 2 }) })));
    const repository = new JsonLevelRepository('/levels');

    await expect(repository.listLevels()).rejects.toThrow('Level manifest validation failed');
  });

  it('keeps fetch failures explicit for application error handling', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    const repository = new JsonLevelRepository('/levels');

    await expect(repository.listLevels()).rejects.toThrow('Failed to load level manifest: 503');
  });
});
