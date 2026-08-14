import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');
const htmlSource = readFileSync(join(root, 'index.html'), 'utf8');

describe('PROD-006 release info composition root', () => {
  it('constructs repository and use case, then initializes release info without blocking game bootstrap', () => {
    expect(mainSource).toContain("import JsonReleaseManifestRepository from './Infrastructure/Repositories/JsonReleaseManifestRepository.js';");
    expect(mainSource).toContain("import GetBuildInfoUseCase from './Application/UseCases/GetBuildInfoUseCase.js';");
    expect(mainSource).toContain("import { initializeReleaseInfoForApp } from './Presentation/bootstrap/initializeReleaseInfoForApp.js';");
    expect(mainSource).toContain("const releaseManifestRepository = new JsonReleaseManifestRepository('./release-manifest.json');");
    expect(mainSource).toContain('const getBuildInfoUseCase = new GetBuildInfoUseCase(releaseManifestRepository);');
    expect(mainSource).toContain('await initializeReleaseInfoForApp({');
    expect(mainSource).toContain("releaseInfoContainer: document.getElementById('release-info-container')");
  });

  it('provides a dedicated accessible HUD anchor for release identity', () => {
    expect(htmlSource).toContain('id="release-info-container"');
    expect(htmlSource).toContain('aria-label="Сведения о версии"');
  });
});
