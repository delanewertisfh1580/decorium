import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const sceneLifeSource = readFileSync('src/Presentation/Scene/SceneLifeSystem.js', 'utf8');

describe('client-owned evaluation feedback', () => {
  it('does not render explanatory passage labels inside the 3D scene', () => {
    expect(sceneLifeSource).not.toContain('СВОБОДНЫЙ ПРОХОД');
    expect(sceneLifeSource).not.toContain('labelSprite');
    expect(sceneLifeSource).not.toContain('_buildPassageNarrative');
  });
});
