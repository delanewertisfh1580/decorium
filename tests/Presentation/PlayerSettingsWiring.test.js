import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');
const htmlSource = readFileSync(join(root, 'index.html'), 'utf8');

describe('PROD-005 player settings composition root', () => {
  it('constructs and initializes the settings application workflow using the existing profile persistence port', () => {
    expect(mainSource).toContain("import UpdatePlayerSettingsUseCase from './Application/UseCases/UpdatePlayerSettingsUseCase.js';");
    expect(mainSource).toContain("import { initializePlayerSettingsForApp } from './Presentation/bootstrap/initializePlayerSettingsForApp.js';");
    expect(mainSource).toContain('const updatePlayerSettingsUseCase = new UpdatePlayerSettingsUseCase(');
    expect(mainSource).toContain('const settingsInitialization = await initializePlayerSettingsForApp({');
    expect(mainSource).toContain('updatePlayerSettingsUseCase,');
    expect(mainSource).toContain("settingsContainer: document.getElementById('settings-container')");
  });

  it('provides a dedicated accessible settings container without displacing the 3D scene', () => {
    expect(htmlSource).toContain('id="settings-container"');
    expect(htmlSource).toContain('aria-label="Настройки игрока"');
  });
});
