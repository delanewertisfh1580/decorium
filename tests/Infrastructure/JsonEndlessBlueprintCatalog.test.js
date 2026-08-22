import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import JsonEndlessBlueprintCatalog from '../../src/Infrastructure/Repositories/JsonEndlessBlueprintCatalog.js';

const root = process.cwd();
const readJson = relativePath => JSON.parse(readFileSync(join(root, relativePath), 'utf8'));

afterEach(() => vi.unstubAllGlobals());

describe('JsonEndlessBlueprintCatalog', () => {
  it('validates and caches the versioned authored catalog', async () => {
    const schema = readJson('data/endless/endless-blueprint.v1.schema.json');
    const content = readJson('data/endless/endless-blueprints.v1.json');
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(content), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const catalog = new JsonEndlessBlueprintCatalog('/endless.json', schema);

    const first = await catalog.listBlueprints();
    const second = await catalog.listBlueprints();

    expect(first).toBe(second);
    expect(first).toHaveLength(3);
    expect(Object.isFrozen(first[0])).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps every generated blueprint resolvable to a shipped V3 presentation environment', () => {
    const catalog = readJson('data/endless/endless-blueprints.v1.json');
    const environmentProfiles = readJson('data/presentation/environment-profiles.v3.json');
    const feedback = readJson('data/feedback/scandinavian-feedback.json');
    const environmentIds = new Set(environmentProfiles.profiles.map(profile => profile.id));
    const feedbackIds = new Set(feedback.map(entry => entry.id));

    for (const blueprint of catalog.blueprints) {
      expect(environmentIds).toContain(blueprint.presentationProfileId);
      expect(feedbackIds).toContain(blueprint.clientPriority.messageKey);
    }
  });
});
