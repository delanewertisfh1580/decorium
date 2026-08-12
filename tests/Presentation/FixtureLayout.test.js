import { describe, expect, it } from 'vitest';
import { getFixtureLayout, validateFixtureLayout } from '../../src/Presentation/Scene/FixtureLayout.js';

describe('UI-ROOM-004 fixture layout', () => {
  it('keeps the ambient bookshelf clear of the television', () => {
    const layout = getFixtureLayout(8, 6);
    const tvRight = layout.tv.centerX + layout.tv.width / 2;
    const shelfLeft = layout.bookshelf.centerX - layout.bookshelf.width / 2;

    expect(shelfLeft - tvRight).toBeGreaterThanOrEqual(layout.clearance);
    expect(layout.bookshelf.z).toBeLessThan(6);
  });

  it('keeps wall fixtures inside the room and validates the layout', () => {
    const layout = getFixtureLayout(8, 6);

    expect(layout.bookshelf.centerX).toBeGreaterThan(0);
    expect(layout.bookshelf.centerX).toBeLessThan(8);
    expect(layout.mirror.centerX).toBeGreaterThan(0);
    expect(layout.mirror.centerX).toBeLessThan(8);
    expect(validateFixtureLayout(layout, 8, 6)).toEqual([]);
  });

  it('rejects overlapping or out-of-bounds fixture layouts', () => {
    expect(validateFixtureLayout({
      tv: { centerX: 1, width: 2 },
      bookshelf: { centerX: 1.2, width: 1.2, z: 2 },
      mirror: { centerX: 2, z: 6 }
    }, 8, 6)).toContain('overlap');
  });
});
