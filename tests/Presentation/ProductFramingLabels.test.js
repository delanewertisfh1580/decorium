import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const gameControllerSource = readFileSync('src/Presentation/Controllers/GameController.js', 'utf8');
const documentSource = readFileSync('index.html', 'utf8');

describe('production product framing labels', () => {
  it('does not retain Scandinavian-only language in the dashboard', () => {
    expect(gameControllerSource).not.toContain('Scandi');
  });

  it('uses neutral product labels in the document shell', () => {
    expect(documentSource).toContain('<title>Decorium</title>');
    expect(documentSource).toContain('Interior Design Game');
    expect(documentSource).not.toContain('Scandinavian Room');
    expect(documentSource).not.toContain('Scandinavian room lab');
  });
});
