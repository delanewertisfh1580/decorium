import { describe, expect, it } from 'vitest';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';

describe('InteractionProfile', () => {
  it('creates an immutable v1 semantic capability profile for functional layout rules', () => {
    const profile = new InteractionProfile({
      schemaVersion: 1,
      affordances: ['dining-seat'],
      frontAxis: 'positiveZ',
      usableSides: []
    });

    expect(profile.schemaVersion).toBe(1);
    expect(profile.hasAffordance('dining-seat')).toBe(true);
    expect(profile.hasAffordance('dining-surface')).toBe(false);
    expect(profile.frontAxis).toBe('positiveZ');
    expect(profile.usableSides).toEqual([]);
    expect(profile.toJSON()).toEqual({
      schemaVersion: 1,
      affordances: ['dining-seat'],
      frontAxis: 'positiveZ',
      usableSides: []
    });
    expect(Object.isFrozen(profile)).toBe(true);
  });

  it('supports explicit work-seat and work-surface semantics for client-authored work scenarios', () => {
    const profile = new InteractionProfile({
      schemaVersion: 1,
      affordances: ['work-seat', 'work-surface'],
      frontAxis: 'positiveZ',
      usableSides: []
    });

    expect(profile.hasAffordance('work-seat')).toBe(true);
    expect(profile.hasAffordance('work-surface')).toBe(true);
  });

  it('provides an explicit empty v1 profile for items without functional affordances', () => {
    expect(InteractionProfile.empty().toJSON()).toEqual({
      schemaVersion: 1,
      affordances: [],
      frontAxis: null,
      usableSides: []
    });
  });

  it('rejects unversioned, unknown or duplicate interaction semantics', () => {
    expect(() => new InteractionProfile({ schemaVersion: 2, affordances: [] }))
      .toThrow('InteractionProfile schemaVersion must be 1');
    expect(() => new InteractionProfile({ schemaVersion: 1, affordances: ['table-magic'] }))
      .toThrow('InteractionProfile affordance is not supported: table-magic');
    expect(() => new InteractionProfile({ schemaVersion: 1, affordances: ['dining-seat', 'dining-seat'] }))
      .toThrow('InteractionProfile affordances must be unique');
    expect(() => new InteractionProfile({ schemaVersion: 1, affordances: [], frontAxis: 'diagonal' }))
      .toThrow('InteractionProfile frontAxis is invalid: diagonal');
  });
});
