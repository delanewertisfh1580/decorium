import * as THREE from 'three';
import LocationEnvironmentSystem from './LocationEnvironmentSystem.js';
import { getFixtureLayout } from './FixtureLayout.js';
import { getGaitPose, getTelevisionMotion } from './lifeAnimationConfig.js';

function sceneMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function box(width, height, depth, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), sceneMaterial(color, options));
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function createPet() {
  const pet = new THREE.Group();
  pet.userData.kind = 'scene-life-pet';
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10), sceneMaterial(0xc18a63));
  body.scale.set(1.35, 0.8, 0.9);
  body.position.y = 0.27;
  pet.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10), sceneMaterial(0xd3a075));
  head.position.set(0.22, 0.4, 0);
  pet.add(head);
  for (const z of [-0.11, 0.11]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 4), sceneMaterial(0x8d5d4b));
    ear.position.set(0.2, 0.56, z);
    pet.add(ear);
  }
  const legs = [];
  for (const x of [-0.12, 0.12]) {
    for (const z of [-0.12, 0.12]) {
      const leg = box(0.07, 0.22, 0.07, 0x8d5d4b);
      leg.position.set(x, 0.11, z);
      pet.add(leg);
      legs.push(leg);
    }
  }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.34, 10), sceneMaterial(0x8d5d4b));
  tail.position.set(-0.28, 0.4, 0);
  tail.rotation.z = -0.85;
  pet.add(tail);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x101820 });
  for (const z of [-0.065, 0.065]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeMaterial);
    eye.position.set(0.36, 0.44, z);
    pet.add(eye);
  }
  pet.userData.legs = legs;
  pet.userData.tail = tail;
  return pet;
}

export class SceneLifeSystem {
  constructor(scene, roomGroup, { width, depth }) {
    this.scene = scene;
    this.roomGroup = roomGroup;
    this.width = width;
    this.depth = depth;
    this.root = new THREE.Group();
    this.root.userData.kind = 'scene-life';
    this.screen = null;
    this.screenGlow = null;
    this.screenBars = [];
    this.screenContent = [];
    this.screenOrb = null;
    this.screenScanlines = [];
    this.pet = null;
    this.motes = [];
    this.lampLight = null;
    this._time = 0;
    this.fixtureLayout = getFixtureLayout(width, depth);
    this.locationEnvironment = new LocationEnvironmentSystem(scene, { width, depth });
    this._build();
    this.scene.add(this.root);
  }

  _build() {
    this._buildTelevision();
    this._buildPet();
    this._buildMotes();
  }

  _buildTelevision() {
    const z = this.depth - 0.13;
    const tv = new THREE.Group();
    tv.position.set(this.fixtureLayout.tv.centerX, 0, z);
    const frame = box(1.75, 1.05, 0.12, 0x202d3a, { metalness: 0.35, roughness: 0.42 });
    frame.position.y = 1.78;
    tv.add(frame);
    this.screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.56, 0.82),
      new THREE.MeshBasicMaterial({ color: 0x164766, transparent: true, opacity: 0.96 })
    );
    this.screen.position.set(0, 1.78, -0.071);
    this.screen.rotation.y = Math.PI;
    tv.add(this.screen);
    this.screenGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.66, 0.88),
      new THREE.MeshBasicMaterial({
        color: 0x6bd6ed,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.screenGlow.position.set(0, 1.78, -0.082);
    this.screenGlow.rotation.y = Math.PI;
    tv.add(this.screenGlow);
    for (let index = 0; index < 4; index += 1) {
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.52 + index * 0.1, 0.05),
        new THREE.MeshBasicMaterial({ color: [0x86d8d0, 0xf0c477, 0xf48a7d, 0x9db7ff][index], transparent: true, opacity: 0.82 })
      );
      bar.userData.baseX = -0.36 + index * 0.08;
      bar.userData.baseY = 1.48 + index * 0.14;
      bar.position.set(bar.userData.baseX, bar.userData.baseY, -0.078);
      bar.rotation.y = Math.PI;
      tv.add(bar);
      this.screenBars.push(bar);
    }
    const contentColors = [0xf0c477, 0x86d8d0, 0xf48a7d];
    const contentSizes = [[0.28, 0.16], [0.42, 0.18], [0.22, 0.13]];
    const contentPositions = [[-0.42, 1.49], [0.02, 1.7], [0.36, 1.92]];
    for (let index = 0; index < contentColors.length; index += 1) {
      const [contentWidth, contentHeight] = contentSizes[index];
      const content = new THREE.Mesh(
        new THREE.PlaneGeometry(contentWidth, contentHeight),
        new THREE.MeshBasicMaterial({ color: contentColors[index], transparent: true, opacity: 0.78, depthWrite: false })
      );
      content.userData.baseX = contentPositions[index][0];
      content.userData.baseY = contentPositions[index][1];
      content.position.set(content.userData.baseX, content.userData.baseY, -0.084);
      content.rotation.y = Math.PI;
      tv.add(content);
      this.screenContent.push(content);
    }
    this.screenOrb = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 18),
      new THREE.MeshBasicMaterial({ color: 0xfff0bd, transparent: true, opacity: 0.88, depthWrite: false })
    );
    this.screenOrb.position.set(0.27, 1.61, -0.087);
    this.screenOrb.rotation.y = Math.PI;
    tv.add(this.screenOrb);
    for (let index = 0; index < 6; index += 1) {
      const scanline = new THREE.Mesh(
        new THREE.PlaneGeometry(1.42, 0.014),
        new THREE.MeshBasicMaterial({ color: 0xe6ffff, transparent: true, opacity: 0.1, depthWrite: false })
      );
      scanline.userData.baseY = 1.43 + index * 0.13;
      scanline.position.set(0, scanline.userData.baseY, -0.086);
      scanline.rotation.y = Math.PI;
      tv.add(scanline);
      this.screenScanlines.push(scanline);
    }
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0x5de2b2 }));
    led.position.set(0.74, 1.38, -0.08);
    tv.add(led);
    this.lampLight = new THREE.PointLight(0x3e9ed3, 1.1, 4);
    this.lampLight.position.set(0, 1.6, -0.1);
    tv.add(this.lampLight);
    this.root.add(tv);

    const console = box(1.8, 0.22, 0.42, 0x6f584b, { roughness: 0.8 });
    console.position.set(this.fixtureLayout.tv.centerX, 0.82, z + 0.02);
    this.root.add(console);
  }

  _buildPet() {
    this.pet = createPet();
    this.pet.position.set(1.15, 0, this.depth * 0.48);
    this.root.add(this.pet);
  }

  _buildMotes() {
    const geometry = new THREE.SphereGeometry(0.018, 6, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xf4d8a0, transparent: true, opacity: 0.32 });
    for (let index = 0; index < 14; index += 1) {
      const mote = new THREE.Mesh(geometry, material.clone());
      mote.position.set(0.35 + (index * 1.37) % (this.width - 0.7), 1.1 + (index % 5) * 0.34, 0.35 + (index * 0.83) % (this.depth - 0.7));
      mote.userData.phase = index * 0.7;
      this.root.add(mote);
      this.motes.push(mote);
    }
  }

  update(time) {
    this.locationEnvironment.update(time);
    this._time = time * 0.001;
    const televisionMotion = getTelevisionMotion(this._time);
    if (this.screen) {
      this.screen.material.color.setHSL(0.55 + Math.sin(this._time * 0.4) * 0.03 + televisionMotion.frame * 0.04, 0.5, 0.22 + televisionMotion.glow * 0.08);
      this.screen.material.opacity = 0.82 + televisionMotion.glow * 0.14;
    }
    if (this.screenGlow) {
      this.screenGlow.material.opacity = 0.08 + televisionMotion.glow * 0.1;
      this.screenGlow.material.color.setHSL(0.54 + televisionMotion.scanline * 0.05, 0.7, 0.62);
    }
    this.screenBars.forEach((bar, index) => {
      bar.position.x = bar.userData.baseX + televisionMotion.barOffsets[index];
      bar.position.y = bar.userData.baseY + Math.sin(this._time * 1.1 + index) * 0.018;
      bar.material.opacity = 0.36 + televisionMotion.glow * 0.26 + televisionMotion.scanline * 0.1;
    });
    this.screenContent.forEach((content, index) => {
      content.position.x = content.userData.baseX + televisionMotion.contentOffsets[index];
      content.position.y = content.userData.baseY + Math.sin(this._time * (0.7 + index * 0.16) + index) * 0.018;
      content.material.opacity = 0.54 + televisionMotion.glow * 0.2 + (index === 1 ? televisionMotion.scanline * 0.12 : 0);
    });
    if (this.screenOrb) {
      this.screenOrb.position.x = 0.27 + televisionMotion.contentOffsets[0] * 0.45;
      this.screenOrb.position.y = 1.61 + Math.sin(this._time * 0.9) * 0.035;
      this.screenOrb.material.opacity = 0.62 + televisionMotion.scanline * 0.24;
    }
    this.screenScanlines.forEach((line, index) => {
      const travel = ((televisionMotion.frame * 1.7 + index / this.screenScanlines.length) % 1) - 0.5;
      line.position.y = 1.78 + travel * 0.78;
      line.material.opacity = 0.04 + televisionMotion.scanline * 0.14;
    });
    if (this.lampLight) this.lampLight.intensity = 0.65 + televisionMotion.glow * 0.45;
    if (this.pet) {
      const progress = (Math.sin(this._time * 0.34) + 1) / 2;
      this.pet.position.x = 1.0 + progress * (this.width - 2.0);
      this.pet.position.z = this.depth * 0.48 + Math.sin(this._time * 0.9) * 0.08;
      const gait = getGaitPose(this._time, 0.18, 'animal');
      this.pet.position.y = gait.bodyBob;
      this.pet.rotation.y = progress > 0.5 ? Math.PI : 0;
      this.pet.userData.legs.forEach((leg, index) => {
        leg.rotation.z = gait.legs[index];
      });
      this.pet.userData.tail.rotation.z = -0.85 + gait.tailSwing;
    }
    this.motes.forEach(mote => {
      mote.position.y += Math.sin(this._time * 0.7 + mote.userData.phase) * 0.0008;
      mote.material.opacity = 0.16 + (Math.sin(this._time * 1.2 + mote.userData.phase) + 1) * 0.08;
    });
  }

  destroy() {
    this.locationEnvironment.destroy();
    this.root.traverse(child => {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach(material => material.dispose());
      else child.material?.dispose();
      if (child.userData.texture) child.userData.texture.dispose();
    });
    this.scene.remove(this.root);
  }
}

export default SceneLifeSystem;
