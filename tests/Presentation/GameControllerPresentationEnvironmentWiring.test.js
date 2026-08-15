import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/Presentation/Controllers/GameController.js', 'utf8');

describe('GameController presentation environment wiring', () => {
  it('applies the hydrated authored environment to RoomView before rendering a loaded level', () => {
    expect(source).toContain('this.roomView.setPresentationEnvironment(this.level.presentationEnvironment);');
  });
});
