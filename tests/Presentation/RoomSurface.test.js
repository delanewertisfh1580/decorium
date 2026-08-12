import { describe, expect, it } from 'vitest';
import { ROOM_SURFACE_CONFIG, validateRoomSurface } from '../../src/Presentation/Scene/roomSurfaceConfig.js';

describe('UI-ROOM-006 room surface contract', () => {
  it('uses a quiet matte floor and disables the debug grid', () => {
    expect(ROOM_SURFACE_CONFIG.gridVisible).toBe(false);
    expect(ROOM_SURFACE_CONFIG.style).toBe('matte-warm');
    expect(ROOM_SURFACE_CONFIG.roughness).toBeGreaterThanOrEqual(0.8);
    expect(validateRoomSurface(ROOM_SURFACE_CONFIG)).toEqual([]);
  });

  it('rejects a visible grid or glossy presentation floor', () => {
    expect(validateRoomSurface({ ...ROOM_SURFACE_CONFIG, gridVisible: true })).toContain('gridVisible');
    expect(validateRoomSurface({ ...ROOM_SURFACE_CONFIG, roughness: 0.2 })).toContain('roughness');
  });
});
