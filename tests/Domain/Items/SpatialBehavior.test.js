import { describe, expect, it } from 'vitest';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

describe('SpatialBehavior', () => {
  it('exposes immutable authored placement, occupancy, clearance and support semantics', () => {
    const behavior = new SpatialBehavior({
      schemaVersion: 1,
      placementKind: 'wall',
      occupancyMode: 'ignored',
      clearanceMode: 'ignored',
      supportMode: 'surface'
    });

    expect(behavior.toJSON()).toEqual({
      schemaVersion: 1,
      placementKind: 'wall',
      occupancyMode: 'ignored',
      clearanceMode: 'ignored',
      supportMode: 'surface'
    });
    expect(behavior.isFloorObstacle).toBe(false);
    expect(behavior.providesSupportSurface).toBe(true);
    expect(Object.isFrozen(behavior)).toBe(true);
  });

  it('allows a free-standing floor obstacle but rejects contradictory spatial semantics', () => {
    const floorFurniture = new SpatialBehavior({
      schemaVersion: 1,
      placementKind: 'floor',
      occupancyMode: 'occupies',
      clearanceMode: 'obstacle',
      supportMode: 'surface'
    });

    expect(floorFurniture.isFloorObstacle).toBe(true);
    expect(() => new SpatialBehavior({
      schemaVersion: 1,
      placementKind: 'floor-overlay',
      occupancyMode: 'occupies',
      clearanceMode: 'obstacle',
      supportMode: 'none'
    })).toThrow('SpatialBehavior floor-overlay must ignore occupancy and clearance');
  });
});


describe('SpatialBehavior supported placement', () => {
  it('models a surface-mounted item as non-floor occupancy while preserving its distinct authored placement kind', () => {
    const behavior = new SpatialBehavior({
      schemaVersion: 1,
      placementKind: 'surface-mounted',
      occupancyMode: 'ignored',
      clearanceMode: 'ignored',
      supportMode: 'none'
    });

    expect(behavior.placementKind).toBe('surface-mounted');
    expect(behavior.isFloorObstacle).toBe(false);
  });
});
