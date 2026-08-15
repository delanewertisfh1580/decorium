import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync('src/main.js', 'utf8');

describe('PROD-015 storage PBR asset wiring', () => {
  it('composes the versioned storage manifest with existing presentation asset packs and never imports it into gameplay layers', () => {
    expect(mainSource).toContain("import storagePbrAssetManifest from '../data/visuals/storage-pbr-assets.v1.json';");
    expect(mainSource).toContain('manifests: [furnitureAssetManifest, loungePbrAssetManifest, diningTablePbrAssetManifest, storagePbrAssetManifest]');
    expect(mainSource).not.toContain("Domain/Assets");
    expect(mainSource).not.toContain("Application/Assets");
  });
});
