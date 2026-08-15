import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync('src/main.js', 'utf8');

describe('PROD-014 dining/table PBR asset wiring', () => {
  it('composes the versioned dining/table presentation manifest with existing asset packs only at the application composition root', () => {
    expect(mainSource).toContain("import diningTablePbrAssetManifest from '../data/visuals/dining-table-pbr-assets.v1.json';");
    expect(mainSource).toContain('manifests: [furnitureAssetManifest, loungePbrAssetManifest, diningTablePbrAssetManifest');
    expect(mainSource).not.toContain("Domain/Assets");
    expect(mainSource).not.toContain("Application/Assets");
  });
});
