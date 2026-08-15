import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/Presentation/Views/RoomView.js', 'utf8');

describe('PROD-013 PBR environment wiring', () => {
  it('provides a PMREM-generated room environment for MeshStandardMaterial assets and disposes it with RoomView', () => {
    expect(source).toContain("import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';");
    expect(source).toContain('new THREE.PMREMGenerator(this.renderer)');
    expect(source).toContain('this.scene.environment = this._pbrEnvironment.texture;');
    expect(source).toContain('this._pbrEnvironment?.dispose();');
  });
});
