import { afterEach, describe, expect, it, vi } from 'vitest';
import JsonClientBriefRepository from '../../src/Infrastructure/Repositories/JsonClientBriefRepository.js';

const schema = {
  type: 'object',
  required: ['schemaVersion', 'briefs'],
  properties: {
    schemaVersion: { const: 2 },
    briefs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['schemaVersion', 'id', 'levelId', 'client', 'title', 'summary', 'styleTargets', 'clientPriorities', 'spatialPreferences', 'evaluationPolicy']
      }
    }
  }
};

const catalog = {
  schemaVersion: 2,
  briefs: [{
    schemaVersion: 2,
    id: 'brief-warm-host-001',
    levelId: 'level-001',
    client: { id: 'client-warm-host', displayName: 'Марина и Алексей' },
    title: 'Гостиная для тёплых ужинов',
    summary: 'Нужна спокойная гостиная.',
    styleTargets: [{ styleId: 'scandinavian', role: 'primary', weight: 1 }],
    clientPriorities: [{ id: 'host-guests', label: 'Принимать гостей', weight: 1 }],
    spatialPreferences: {
      density: 'intimate',
      clearanceMultiplier: 0.75,
      emptySpacePreference: { mode: 'discourage-excess', targetFreeAreaRatio: 0.42, weight: 0.8 }
    },
    evaluationPolicy: {
      styleMode: 'weighted-targets-v1',
      completion: { minimumStars: 3, criticalRuleMode: 'block-completion' },
      compositionRules: {},
      ergonomicsRules: {}
    }
  }]
};

describe('JsonClientBriefRepository', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads a schema-valid catalog once and returns an immutable isolated authored brief by ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => structuredClone(catalog) });
    vi.stubGlobal('fetch', fetchMock);
    const repository = new JsonClientBriefRepository('./data/briefs/client-briefs.v2.json', schema);

    const first = await repository.getById('brief-warm-host-001');
    const second = await repository.getById('brief-warm-host-001');

    expect(first).toEqual(catalog.briefs[0]);
    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.client)).toBe(true);
    expect(await repository.getById('missing-brief')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid authored data rather than inferring a default client or style', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ schemaVersion: 2, briefs: [{}] }) }));
    const repository = new JsonClientBriefRepository('./data/briefs/client-briefs.v2.json', schema);

    await expect(repository.getById('brief-warm-host-001')).rejects.toThrow('ClientBrief schema validation failed');
  });
});
