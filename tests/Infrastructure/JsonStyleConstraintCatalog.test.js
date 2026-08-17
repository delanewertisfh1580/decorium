import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonConstraintCatalog } from '../../src/Infrastructure/DataLoaders/JsonConstraintCatalog.js';
import { LinearConstraint } from '../../src/Domain/Constraints/LinearConstraint.js';

const catalogData = {
  schemaVersion: 1,
  profiles: [
    {
      schemaVersion: 1,
      id: 'scandinavian',
      label: 'Скандинавский',
      constraints: [{ id: 'scand-wood-min', feature: 'woodShare', operator: 'gte', threshold: 0.5, weight: 2, messageKey: 'scand-wood-low' }]
    },
    {
      schemaVersion: 1,
      id: 'japandi',
      label: 'Japandi',
      constraints: [{ id: 'japandi-simple-forms', feature: 'formSimplicity', operator: 'gte', threshold: 0.65, weight: 1.2, messageKey: 'japandi-forms-complex' }]
    }
  ]
};

const schema = {
  type: 'object',
  required: ['schemaVersion', 'profiles'],
  properties: { schemaVersion: { const: 1 }, profiles: { type: 'array' } }
};

describe('JsonConstraintCatalog V1', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resolves exact authored profile constraints and returns no heuristic fallback for unknown style', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => structuredClone(catalogData) }));
    const catalog = new JsonConstraintCatalog('/styles.json', schema);

    const japandi = await catalog.getConstraintsByStyleId('japandi');

    expect(japandi).toHaveLength(1);
    expect(japandi[0]).toMatchObject({ id: 'japandi-simple-forms', featureKey: 'formSimplicity', operator: 'gte' });
    await expect(catalog.getConstraintsByStyleId('unknown-style')).resolves.toEqual([]);
  });
});


describe('PROD-023 authored style profile lookup', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the exact immutable style profile with its authored label and no heuristic fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => structuredClone(catalogData) }));
    const catalog = new JsonConstraintCatalog('/styles.json', schema);

    const profile = await catalog.getStyleProfileById('japandi');

    expect(profile).toMatchObject({ id: 'japandi', label: 'Japandi' });
    expect(profile.constraints[0]).toBeInstanceOf(LinearConstraint);
    expect(Object.isFrozen(profile)).toBe(true);
    await expect(catalog.getStyleProfileById('unknown-style')).resolves.toBeNull();
  });
});
