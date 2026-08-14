import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');

describe('PROD-004 progression composition root', () => {
  it('constructs campaign and completion application workflows from the domain progression policy', () => {
    expect(mainSource).toContain("import ProgressionPolicy from './Domain/Progression/ProgressionPolicy.js';");
    expect(mainSource).toContain("import GetCampaignLevelsUseCase from './Application/UseCases/GetCampaignLevelsUseCase.js';");
    expect(mainSource).toContain("import RecordLevelCompletionUseCase from './Application/UseCases/RecordLevelCompletionUseCase.js';");
    expect(mainSource).toContain('const progressionPolicy = new ProgressionPolicy();');
    expect(mainSource).toContain('const getCampaignLevelsUseCase = new GetCampaignLevelsUseCase(levelRepository, progressionPolicy);');
    expect(mainSource).toContain('const recordLevelCompletionUseCase = new RecordLevelCompletionUseCase(');
  });

  it('injects profile-aware campaign selection and evaluation completion workflows into Presentation orchestration', () => {
    expect(mainSource).toContain('recordLevelCompletionUseCase,');
    expect(mainSource).toContain('playerProfile,');
    expect(mainSource).toContain('getCampaignLevelsUseCase,');
    expect(mainSource).toContain('controller.setPlayerProfile(playerProfile);');
    expect(mainSource).toContain('controller.setCompletionProfileListener(levelSelection.refresh);');
  });
});
