import { describe, expect, it } from 'vitest';
import { DESIGN_TOKENS, validateDesignTokens } from '../../src/Presentation/UI/designTokens.js';

describe('UI-VIS-000 design tokens', () => {
  it('defines the canonical reference resolution and spacing scale', () => {
    expect(DESIGN_TOKENS.reference).toEqual({ width: 1280, height: 720 });
    expect(Object.values(DESIGN_TOKENS.spacing)).toEqual([4, 8, 12, 16, 24, 32, 48]);
  });

  it('keeps readable typography and accessible touch targets', () => {
    expect(DESIGN_TOKENS.typography.body).toBeGreaterThanOrEqual(20);
    expect(DESIGN_TOKENS.typography.secondary).toBeGreaterThanOrEqual(16);
    expect(DESIGN_TOKENS.typography.button).toBeGreaterThanOrEqual(20);
    expect(DESIGN_TOKENS.touchTarget.minimum).toBeGreaterThanOrEqual(44);
  });

  it('defines calm visual states and bounded motion durations', () => {
    expect(DESIGN_TOKENS.colors.background).toMatch(/^#/);
    expect(DESIGN_TOKENS.colors.accent).toMatch(/^#/);
    expect(DESIGN_TOKENS.motion.micro).toBeGreaterThanOrEqual(80);
    expect(DESIGN_TOKENS.motion.micro).toBeLessThanOrEqual(120);
    expect(DESIGN_TOKENS.motion.panel).toBeGreaterThan(DESIGN_TOKENS.motion.micro);
  });

  it('rejects incomplete or inaccessible token contracts', () => {
    expect(validateDesignTokens(DESIGN_TOKENS)).toEqual([]);
    expect(validateDesignTokens({})).toContain('reference.width');
    expect(validateDesignTokens({
      ...DESIGN_TOKENS,
      typography: { ...DESIGN_TOKENS.typography, body: 14 }
    })).toContain('typography.body');
  });
});
