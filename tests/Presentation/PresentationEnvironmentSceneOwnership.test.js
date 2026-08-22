import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const roomViewSource = readFileSync('src/Presentation/Views/RoomView.js', 'utf8');
const sceneLifeSource = readFileSync('src/Presentation/Scene/SceneLifeSystem.js', 'utf8');
const locationEnvironmentSource = readFileSync('src/Presentation/Scene/LocationEnvironmentSystem.js', 'utf8');

describe('player-owned interior scene ownership', () => {
  it('passes a resolved V3 environment plan to exterior life and uses RoomState surface slots in RoomView', () => {
    expect(roomViewSource).toContain('setPresentationEnvironment(environment)');
    expect(roomViewSource).toContain('resolveEnvironmentProfilePlan(environment)');
    expect(roomViewSource).toContain('setSurfaceFinishes(finishes)');
    expect(roomViewSource).toContain('new SceneLifeSystem(this.scene, this.roomGroup, {');
    expect(roomViewSource).toContain('environmentPlan: this.environmentPlan');
    expect(sceneLifeSource).toContain('constructor(scene, roomGroup, { width, depth, environmentPlan })');
    expect(locationEnvironmentSource).toContain('constructor(scene, { width, depth, environmentPlan');
  });

  it('contains no profile fixture, built-in or room composition asset code path', () => {
    expect(sceneLifeSource).not.toContain('roomCompositionAssetRepository');
    expect(locationEnvironmentSource).not.toContain('fixtureLayout');
    expect(locationEnvironmentSource).not.toContain('interactiveFixtures');
    expect(locationEnvironmentSource).not.toContain('_buildInteriorDetails');
    expect(locationEnvironmentSource).not.toContain('television');
    expect(locationEnvironmentSource).not.toContain('restingCat');
  });
});
