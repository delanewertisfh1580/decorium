import { describe, expect, it } from 'vitest';
import {
  OPENING_PRESETS,
  openingPresetById,
  openingClearanceRects,
  createOpeningPassageZones,
  resolveRoomOpenings
} from '../../../src/Domain/Rooms/RoomOpenings.js';
import PassageZone from '../../../src/Domain/Ergonomics/PassageZone.js';

describe('RoomOpenings', () => {
  it('exposes every authored preset id used by environment profiles', () => {
    expect(Object.keys(OPENING_PRESETS)).toEqual([
      'living-window-and-door',
      'media-narrow-window',
      'studio-wide-window'
    ]);
    expect(openingPresetById('living-window-and-door')).toBe(OPENING_PRESETS['living-window-and-door']);
    expect(() => openingPresetById('unknown-preset')).toThrow(/unsupported openings preset/);
  });

  it('resolves deterministic frozen opening geometry inside the room bounds', () => {
    const first = resolveRoomOpenings({ width: 8, depth: 6, wallHeight: 3.2, preset: OPENING_PRESETS['living-window-and-door'] });
    const second = resolveRoomOpenings({ width: 8, depth: 6, wallHeight: 3.2, preset: OPENING_PRESETS['living-window-and-door'] });
    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);

    expect(first.door).toMatchObject({ wall: 'left' });
    expect(first.door.centerZ).toBeCloseTo(6 * 0.72, 5);
    expect(first.door.width).toBeLessThanOrEqual(0.9);
    expect(first.window).toMatchObject({ wall: 'back' });
    expect(first.window.centerX - first.window.width / 2).toBeGreaterThanOrEqual(0);
    expect(first.window.centerX + first.window.width / 2).toBeLessThanOrEqual(8);
    expect(first.window.bottom).toBeGreaterThan(0);
    expect(first.window.top).toBeLessThanOrEqual(3.2);
  });

  it('clamps door placement so it always fits within the wall span', () => {
    const narrowRoom = resolveRoomOpenings({ width: 3, depth: 1.2, preset: OPENING_PRESETS['studio-wide-window'] });
    expect(narrowRoom.door.centerZ - narrowRoom.door.width / 2).toBeGreaterThanOrEqual(0);
    expect(narrowRoom.door.centerZ + narrowRoom.door.width / 2).toBeLessThanOrEqual(1.2);
  });

  it('rejects invalid room dimensions and incomplete presets', () => {
    expect(() => resolveRoomOpenings({ width: 0, depth: 5, preset: OPENING_PRESETS['media-narrow-window'] })).toThrow(/positive numbers/);
    expect(() => resolveRoomOpenings({ width: 4, depth: 5, preset: {} })).toThrow(/window and door/);
  });

  it('derives door and window clearance rectangles aligned with resolved openings', () => {
    const depth = 6;
    const rects = openingClearanceRects({ width: 8, depth, presetId: 'living-window-and-door' });

    expect(rects).toHaveLength(2);
    const door = rects.find(rect => rect.kind === 'door');
    const window = rects.find(rect => rect.kind === 'window');

    const resolvedDoor = resolveRoomOpenings({ width: 8, depth, preset: OPENING_PRESETS['living-window-and-door'] }).door;
    expect(door.x).toBe(0);
    expect(door.z).toBeCloseTo(resolvedDoor.centerZ - resolvedDoor.width / 2 - 0.05, 5);
    expect(door.depth).toBeCloseTo(resolvedDoor.width + 0.1, 5);

    const resolvedWindow = resolveRoomOpenings({ width: 8, depth, preset: OPENING_PRESETS['living-window-and-door'] }).window;
    expect(window.z + window.depth).toBe(depth);
    expect(window.x).toBeCloseTo(resolvedWindow.centerX - resolvedWindow.width / 2, 5);
    expect(window.width).toBeCloseTo(resolvedWindow.width, 5);
  });

  it('maps clearance rectangles onto labeled PassageZone constraints', () => {
    const zones = createOpeningPassageZones({ width: 8, depth: 6, presetId: 'living-window-and-door' });

    expect(zones).toHaveLength(2);
    expect(zones.every(zone => zone instanceof PassageZone)).toBe(true);
    expect(zones.map(zone => zone.id)).toEqual(['opening-door', 'opening-window']);
    expect(zones.map(zone => zone.messageKey)).toEqual([
      'ergonomics-opening-door-free',
      'ergonomics-opening-window-free'
    ]);
    expect(zones.find(zone => zone.id === 'opening-door').weight).toBe(1.4);
    expect(zones.find(zone => zone.id === 'opening-window').weight).toBe(1);
    expect(Object.isFrozen(zones)).toBe(true);
  });
});
