import { describe, expect, it } from 'vitest';
import { HUD_LAYOUT, validateHudLayout } from '../../src/Presentation/UI/hudLayout.js';

describe('UI-VIS-001 workspace HUD layout', () => {
  it('keeps the scene primary through a single app bar, contextual drawer and command dock', () => {
    expect(HUD_LAYOUT.referenceSurface).toBe('workspace');
    expect(HUD_LAYOUT.regions).toEqual({
      appBar: 'top',
      drawer: 'contextual',
      commandDock: 'bottom',
      review: 'modal'
    });
    expect(HUD_LAYOUT.maxPanelOpacity).toBeGreaterThanOrEqual(0.92);
    expect(HUD_LAYOUT.singleActiveDrawer).toBe(true);
  });

  it('defines readable touch-first controls and distinct full workspaces', () => {
    expect(HUD_LAYOUT.controlMinHeight).toBeGreaterThanOrEqual(44);
    expect(HUD_LAYOUT.actionLabelSize).toBeLessThanOrEqual(16);
    expect(HUD_LAYOUT.mobileBreakpoint).toBeGreaterThanOrEqual(560);
    expect(HUD_LAYOUT.briefIsStandalone).toBe(true);
    expect(HUD_LAYOUT.reviewIsStandalone).toBe(true);
    expect(HUD_LAYOUT.contextualInspector).toBe(true);
  });

  it('validates the responsive workspace contract', () => {
    expect(validateHudLayout(HUD_LAYOUT)).toEqual([]);
    expect(validateHudLayout({ ...HUD_LAYOUT, referenceSurface: 'scene-first' })).toContain('referenceSurface');
    expect(validateHudLayout({ ...HUD_LAYOUT, controlMinHeight: 32 })).toContain('controlMinHeight');
    expect(validateHudLayout({ ...HUD_LAYOUT, singleActiveDrawer: false })).toContain('singleActiveDrawer');
  });
});
