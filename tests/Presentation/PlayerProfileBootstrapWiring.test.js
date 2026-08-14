import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();
const mainSource = readFileSync(join(projectRoot, 'src/main.js'), 'utf8');
const htmlSource = readFileSync(join(projectRoot, 'index.html'), 'utf8');

describe('PROD-001 player profile bootstrap wiring', () => {
  it('wires profile repository, factory, use case and presentation bootstrap through the composition root', () => {
    expect(mainSource).toContain("BrowserLocalPlayerProfileRepository");
    expect(mainSource).toContain("BrowserPlayerProfileFactory");
    expect(mainSource).toContain("LoadPlayerProfileUseCase");
    expect(mainSource).toContain("loadPlayerProfileForApp");
    expect(mainSource).toContain("window.localStorage");
    expect(mainSource).toContain("document.getElementById('profile-container')");
  });

  it('provides a dedicated accessible profile-status container in the application shell', () => {
    expect(htmlSource).toContain('id="profile-container"');
    expect(htmlSource).toContain('aria-label="Статус профиля"');
  });
});
