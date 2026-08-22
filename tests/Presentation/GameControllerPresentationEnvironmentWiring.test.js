import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/Presentation/Controllers/LevelSessionCoordinator.js', 'utf8');

describe('level session presentation environment wiring', () => {
  it('applies the hydrated authored environment before exposing a loaded room session', () => {
    expect(source).toContain('this.getRoomView()?.setPresentationEnvironment(this.level.presentationEnvironment);');
  });
});
