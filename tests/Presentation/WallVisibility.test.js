import { describe, expect, it } from 'vitest';
import { getWallOpacities } from '../../src/Presentation/Scene/WallVisibility.js';

describe('UI-ROOM-001 wall visibility', () => {
  const room = { width: 8, depth: 6 };

  it('fades walls that are between an outside camera and the room', () => {
    expect(getWallOpacities({ x: 10, y: 5, z: 8 }, room)).toEqual({
      front: 1,
      back: 0.18,
      left: 1,
      right: 0.18
    });
    expect(getWallOpacities({ x: -2, y: 4, z: -2 }, room)).toEqual({
      front: 0.18,
      back: 1,
      left: 0.18,
      right: 1
    });
  });

  it('keeps every wall opaque while the camera is inside the room', () => {
    expect(getWallOpacities({ x: 4, y: 3, z: 3 }, room)).toEqual({
      front: 1,
      back: 1,
      left: 1,
      right: 1
    });
  });
});
