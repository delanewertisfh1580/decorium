import { describe, expect, it } from 'vitest';
import { getRoomOpenings, validateRoomOpenings } from '../../src/Presentation/Scene/RoomArchitecture.js';

describe('UI-ROOM-003 room architecture', () => {
  it('defines a real transparent back-window opening', () => {
    const openings = getRoomOpenings(8, 6, 3.2);

    expect(openings.window.centerX).toBeCloseTo(5.44);
    expect(openings.window.bottom).toBeGreaterThan(0);
    expect(openings.window.top).toBeLessThan(3.2);
    expect(openings.window.glassOpacity).toBeLessThan(0.5);
  });

  it('defines a readable interior door on a wall', () => {
    const openings = getRoomOpenings(8, 6, 3.2);

    expect(openings.door.wall).toBe('left');
    expect(openings.door.height).toBeGreaterThanOrEqual(2);
    expect(openings.door.width).toBeGreaterThanOrEqual(0.8);
    expect(openings.door.centerZ).toBeGreaterThan(0);
    expect(openings.door.centerZ).toBeLessThan(6);
  });

  it('rejects openings that cannot fit inside room bounds', () => {
    expect(validateRoomOpenings(getRoomOpenings(8, 6, 3.2))).toEqual([]);
    expect(validateRoomOpenings({ window: { bottom: 0, top: 5, glassOpacity: 1 }, door: null })).toContain('window');
    expect(validateRoomOpenings({ window: null, door: { wall: 'ceiling' } })).toContain('door');
  });
});
