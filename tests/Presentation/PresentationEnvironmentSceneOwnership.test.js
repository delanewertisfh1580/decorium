import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const roomViewSource = readFileSync('src/Presentation/Views/RoomView.js', 'utf8');
const sceneLifeSource = readFileSync('src/Presentation/Scene/SceneLifeSystem.js', 'utf8');
const locationEnvironmentSource = readFileSync('src/Presentation/Scene/LocationEnvironmentSystem.js', 'utf8');

describe('authored presentation environment scene ownership', () => {
  it('passes a resolved environment plan from RoomView into scene life instead of using a single global scene', () => {
    expect(roomViewSource).toContain('setPresentationEnvironment(environment)');
    expect(roomViewSource).toContain('resolveEnvironmentProfilePlan(environment)');
    expect(roomViewSource).toContain('new SceneLifeSystem(this.scene, this.roomGroup, {');
    expect(roomViewSource).toContain('environmentPlan: this.environmentPlan');
    expect(sceneLifeSource).toContain('constructor(scene, roomGroup, { width, depth, environmentPlan, roomCompositionAssetRepository = null })');
    expect(locationEnvironmentSource).toContain('constructor(scene, { width, depth, environmentPlan');
  });

  it('does not create a global television or a second left-right pet outside profile-owned fixtures', () => {
    expect(sceneLifeSource).not.toContain('this._buildTelevision();');
    expect(sceneLifeSource).not.toContain('this._buildPet();');
    expect(locationEnvironmentSource).toContain('this.environmentPlan.fixtures.includes');
  });
});
