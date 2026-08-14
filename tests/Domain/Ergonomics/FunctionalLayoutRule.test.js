import { describe, expect, it } from 'vitest';
import FunctionalLayoutRule from '../../../src/Domain/Ergonomics/FunctionalLayoutRule.js';

describe('FunctionalLayoutRule', () => {
  it('creates an immutable v1 authored adjacency rule from semantic capability selectors', () => {
    const rule = new FunctionalLayoutRule({
      schemaVersion: 1,
      id: 'dining-seating',
      kind: 'adjacency',
      anchorSelector: { affordance: 'dining-surface' },
      partnerSelector: { affordance: 'dining-seat' },
      minPartners: 1,
      distance: { min: 0.05, max: 0.35 },
      weight: 1.2,
      messageKey: 'functional-dining-seat-required'
    });

    expect(rule.id).toBe('dining-seating');
    expect(rule.kind).toBe('adjacency');
    expect(rule.anchorSelector).toEqual({ affordance: 'dining-surface' });
    expect(rule.partnerSelector).toEqual({ affordance: 'dining-seat' });
    expect(rule.minPartners).toBe(1);
    expect(rule.distance).toEqual({ min: 0.05, max: 0.35 });
    expect(rule.weight).toBe(1.2);
    expect(Object.isFrozen(rule)).toBe(true);
  });

  it('creates a front-adjacency rule with an explicit viewing angle contract', () => {
    const rule = new FunctionalLayoutRule({
      schemaVersion: 1,
      id: 'lounge-seat-faces-view-target',
      kind: 'front-adjacency',
      anchorSelector: { affordance: 'lounge-seat' },
      partnerSelector: { affordance: 'view-target' },
      minPartners: 1,
      distance: { min: 1, max: 4 },
      maxAngleDegrees: 30,
      weight: 1.3,
      messageKey: 'functional-lounge-faces-view-target'
    });

    expect(rule.kind).toBe('front-adjacency');
    expect(rule.maxAngleDegrees).toBe(30);
  });

  it('rejects unversioned, non-semantic and invalid distance contracts', () => {
    const base = {
      schemaVersion: 1, id: 'dining-seating', kind: 'adjacency',
      anchorSelector: { affordance: 'dining-surface' },
      partnerSelector: { affordance: 'dining-seat' },
      minPartners: 1, distance: { min: 0.05, max: 0.35 },
      weight: 1, messageKey: 'functional-dining-seat-required'
    };
    expect(() => new FunctionalLayoutRule({ ...base, schemaVersion: 2 }))
      .toThrow('FunctionalLayoutRule schemaVersion must be 1');
    expect(() => new FunctionalLayoutRule({ ...base, anchorSelector: { type: 'table' } }))
      .toThrow('FunctionalLayoutRule anchorSelector must contain a supported affordance');
    expect(() => new FunctionalLayoutRule({ ...base, distance: { min: 0.4, max: 0.35 } }))
      .toThrow('FunctionalLayoutRule distance min must be lower than max');
    expect(() => new FunctionalLayoutRule({
      ...base,
      kind: 'front-adjacency',
      maxAngleDegrees: 0
    })).toThrow('FunctionalLayoutRule maxAngleDegrees must be greater than 0 and at most 90');
  });
});
