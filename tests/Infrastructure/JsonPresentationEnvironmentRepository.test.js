import { afterEach, describe, expect, it, vi } from 'vitest';
import JsonPresentationEnvironmentRepository from '../../src/Infrastructure/Repositories/JsonPresentationEnvironmentRepository.js';

const schema = {
  type: 'object',
  required: ['schemaVersion', 'profiles'],
  properties: {
    schemaVersion: { const: 2 },
    profiles: {
      type: 'array',
      items: {
        type: 'object',
        required: ['schemaVersion', 'id', 'presentation'],
        properties: {
          schemaVersion: { const: 2 },
          id: { type: 'string' },
          presentation: {
            type: 'object',
            required: ['title', 'subtitle'],
            properties: {
              title: { type: 'string' },
              subtitle: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

const catalog = {
  schemaVersion: 2,
  profiles: [{
    schemaVersion: 2,
    id: 'warm-starter-living',
    presentation: { title: 'Гостиная', subtitle: 'Первые шаги' }
  }]
};

describe('JsonPresentationEnvironmentRepository', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads a schema-valid catalog once and returns an immutable profile by authored ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => catalog });
    vi.stubGlobal('fetch', fetchMock);
    const repository = new JsonPresentationEnvironmentRepository('./data/presentation/environment-profiles.v2.json', schema);

    const profile = await repository.getById('warm-starter-living');

    expect(profile).toEqual(catalog.profiles[0]);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.presentation)).toBe(true);
    expect(await repository.getById('missing-profile')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid authored catalog instead of silently falling back', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ schemaVersion: 2, profiles: [{}] }) }));
    const repository = new JsonPresentationEnvironmentRepository('./data/presentation/environment-profiles.v2.json', schema);

    await expect(repository.getById('warm-starter-living')).rejects.toThrow('Presentation environment schema validation failed');
  });
});
