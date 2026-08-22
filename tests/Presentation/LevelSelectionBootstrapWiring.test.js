import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');
const htmlSource = readFileSync(join(root, 'index.html'), 'utf8');

describe('PROD-002 main-menu campaign and endless selection wiring', () => {
  it('wires campaign catalog, generated session command and menu orchestration through the composition root', () => {
    expect(mainSource).toContain('GetCampaignLevelsUseCase');
    expect(mainSource).toContain('SavePlayerProfileUseCase');
    expect(mainSource).toContain('GenerateEndlessLevelUseCase');
    expect(mainSource).toContain('StartEndlessSessionUseCase');
    expect(mainSource).toContain('initializeMainMenuForApp');
    expect(mainSource).toContain("document.getElementById('main-menu-container')");
  });

  it('provides a dedicated accessible main-menu container rather than an always-visible level dropdown', () => {
    expect(htmlSource).toContain('id="main-menu-container"');
    expect(htmlSource).toContain('aria-label="Главное меню"');
    expect(htmlSource).not.toContain('id="level-select-container"');
  });
});
