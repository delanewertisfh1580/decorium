import { describe, expect, it } from 'vitest';
import { HUD_LAYOUT, validateHudLayout } from '../../src/Presentation/UI/hudLayout.js';

describe('UI-VIS-001 calm HUD layout', () => {
  it('keeps the scene as the primary surface and uses compact HUD regions', () => {
    expect(HUD_LAYOUT.referenceSurface).toBe('scene-first');
    expect(HUD_LAYOUT.regions).toEqual({
      brand: 'top-left',
      summary: 'top-right',
      inventory: 'bottom-left',
      actions: 'bottom-right'
    });
    expect(HUD_LAYOUT.maxPanelOpacity).toBeLessThanOrEqual(0.9);
  });

  it('defines readable controls without allowing oversized HUD typography', () => {
    expect(HUD_LAYOUT.controlMinHeight).toBeGreaterThanOrEqual(44);
    expect(HUD_LAYOUT.actionLabelSize).toBeLessThanOrEqual(16);
    expect(HUD_LAYOUT.inventoryCardWidth).toBeGreaterThanOrEqual(132);
    expect(HUD_LAYOUT.catalogCollapsedByDefault).toBe(true);
    expect(HUD_LAYOUT.scoreCollapsedByDefault).toBe(true);
    expect(HUD_LAYOUT.helpCollapsedByDefault).toBe(true);
    expect(HUD_LAYOUT.contextualHintsOnly).toBe(true);
  });

  it('validates the calm responsive contract', () => {
    expect(validateHudLayout(HUD_LAYOUT)).toEqual([]);
    expect(validateHudLayout({ ...HUD_LAYOUT, referenceSurface: 'dashboard-first' })).toContain('referenceSurface');
    expect(validateHudLayout({ ...HUD_LAYOUT, controlMinHeight: 32 })).toContain('controlMinHeight');
  });
});
