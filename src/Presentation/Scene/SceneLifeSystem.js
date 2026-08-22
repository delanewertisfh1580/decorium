import * as THREE from 'three';
import LocationEnvironmentSystem from './LocationEnvironmentSystem.js';

export class SceneLifeSystem {
  constructor(scene, roomGroup, { width, depth, environmentPlan }) {
    if (!environmentPlan) throw new Error('SceneLifeSystem requires an environmentPlan.');
    this.scene = scene;
    this.roomGroup = roomGroup;
    this.width = width;
    this.depth = depth;
    this.environmentPlan = environmentPlan;
    this.root = new THREE.Group();
    this.root.userData.kind = 'scene-life';
    this.motes = [];
    this.locationEnvironment = new LocationEnvironmentSystem(scene, {
      width,
      depth,
      environmentPlan
    });
    this._buildMotes();
    this.scene.add(this.root);
  }

  _buildMotes() {
    const count = this.environmentPlan.sceneLife.moteCount;
    const color = this.environmentPlan.lighting.warm;
    const geometry = new THREE.SphereGeometry(0.018, 6, 6);
    for (let index = 0; index < count; index += 1) {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24 });
      const mote = new THREE.Mesh(geometry, material);
      mote.position.set(
        0.35 + (index * 1.37) % Math.max(0.7, this.width - 0.7),
        1.1 + (index % 5) * 0.34,
        0.35 + (index * 0.83) % Math.max(0.7, this.depth - 0.7)
      );
      mote.userData.phase = index * 0.7;
      this.root.add(mote);
      this.motes.push(mote);
    }
  }

  update(time) {
    this.locationEnvironment.update(time);
    const seconds = time * 0.001;
    this.motes.forEach(mote => {
      mote.position.y += Math.sin(seconds * 0.7 + mote.userData.phase) * 0.0008;
      mote.material.opacity = 0.12 + (Math.sin(seconds * 1.2 + mote.userData.phase) + 1) * 0.08;
    });
  }

  destroy() {
    this.locationEnvironment.destroy();
    this.root.traverse(child => {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach(material => material.dispose());
      else child.material?.dispose();
    });
    this.scene.remove(this.root);
  }
}

export default SceneLifeSystem;
