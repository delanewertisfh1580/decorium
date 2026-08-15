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

  it('derives different physical openings from an authored environment opening plan', () => {
    const living = getRoomOpenings(8, 6, 3.2, {
      window: { widthFactor: 0.34, centerXFactor: 0.68, height: 1.35, bottom: 1.25, glassOpacity: 0.24, maxWidth: 2.15 },
      door: { centerZFactor: 0.72, width: 0.9, color: 0x394b52 }
    });
    const studio = getRoomOpenings(9, 7, 3.2, {
      window: { widthFactor: 0.56, centerXFactor: 0.56, height: 1.72, bottom: 0.92, glassOpacity: 0.3, maxWidth: 5.4 },
      door: { centerZFactor: 0.24, width: 1.0, color: 0x6f665c }
    });

    expect(studio.window.width).toBeGreaterThan(living.window.width);
    expect(studio.window.centerX).not.toBe(living.window.centerX);
    expect(studio.door.centerZ).toBeCloseTo(1.68);
    expect(studio.door.color).toBe(0x6f665c);
    expect(validateRoomOpenings(studio)).toEqual([]);
  });

  it('rejects openings that cannot fit inside room bounds', () => {
    expect(validateRoomOpenings(getRoomOpenings(8, 6, 3.2))).toEqual([]);
    expect(validateRoomOpenings({ window: { bottom: 0, top: 5, glassOpacity: 1 }, door: null })).toContain('window');
    expect(validateRoomOpenings({ window: null, door: { wall: 'ceiling' } })).toContain('door');
  });
});
