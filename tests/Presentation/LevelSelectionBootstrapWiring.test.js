import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');
const htmlSource = readFileSync(join(root, 'index.html'), 'utf8');

describe('PROD-002 authored level selection wiring', () => {
  it('wires level catalog, session persistence and selector orchestration through the composition root', () => {
    expect(mainSource).toContain('GetCampaignLevelsUseCase');
    expect(mainSource).toContain('SavePlayerProfileUseCase');
    expect(mainSource).toContain('initializeLevelSelectForApp');
    expect(mainSource).toContain("document.getElementById('level-select-container')");
  });

  it('provides a dedicated accessible level-selection container', () => {
    expect(htmlSource).toContain('id="level-select-container"');
    expect(htmlSource).toContain('aria-label="Выбор уровня"');
  });
});
