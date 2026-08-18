import { describe, expect, it } from 'vitest';
import RoomOccupancyProfile from '../../../src/Domain/Scoring/RoomOccupancyProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

describe('RoomOccupancyProfile', () => {
  it('counts an overlapping floor cell once and returns a frozen deterministic free-area profile', () => {
    const roomState = {
      width: 2,
      depth: 2,
      getItems: () => [
        { id: 'table-001', position: { x: 0.5, z: 0.5 }, dimensions: { x: 1, z: 1 }, rotation: 0 },
        { id: 'rug-001', position: { x: 0.5, z: 0.5 }, dimensions: { x: 1, z: 1 }, rotation: 0 }
      ]
    };

    const profile = RoomOccupancyProfile.evaluate({ roomState, cellSizeMeters: 0.5 });

    expect(profile).toEqual({
      schemaVersion: 1,
      cellSizeMeters: 0.5,
      roomArea: 4,
      occupiedArea: 1,
      freeAreaRatio: 0.75
    });
    expect(Object.isFrozen(profile)).toBe(true);
  });

  it('ignores an authored floor overlay instead of treating every catalog footprint as occupied floor area', () => {
    const roomState = {
      width: 2,
      depth: 2,
      getItems: () => [{
        id: 'rug-001',
        position: { x: 1, z: 1 },
        dimensions: { x: 2, z: 2 },
        rotation: 0,
        item: {
          spatialBehavior: new SpatialBehavior({
            schemaVersion: 1,
            placementKind: 'floor-overlay',
            occupancyMode: 'ignored',
            clearanceMode: 'ignored',
            supportMode: 'none'
          })
        }
      }]
    };

    const profile = RoomOccupancyProfile.evaluate({ roomState, cellSizeMeters: 0.5 });

    expect(profile.occupiedArea).toBe(0);
    expect(profile.freeAreaRatio).toBe(1);
  });
});
