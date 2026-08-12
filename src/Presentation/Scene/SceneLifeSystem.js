import * as THREE from 'three';

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

function labelSprite(text, color = '#dcecff') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(10, 20, 31, 0.72)';
  context.roundRect(8, 16, 496, 96, 18);
  context.fill();
  context.font = '700 30px Arial, sans-serif';
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(1.7, 0.42, 1);
  sprite.userData.texture = texture;
  return sprite;
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
  for (const z of [-0.12, 0.12]) {
    const leg = box(0.07, 0.22, 0.07, 0x8d5d4b);
    leg.position.set(-0.12, 0.11, z);
    pet.add(leg);
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
    this.screenBars = [];
    this.pet = null;
    this.motes = [];
    this.lampLight = null;
    this._time = 0;
    this._build();
    this.scene.add(this.root);
  }

  _build() {
    this._buildTelevision();
    this._buildPassageNarrative();
    this._buildPet();
    this._buildMotes();
  }

  _buildTelevision() {
    const z = this.depth - 0.13;
    const tv = new THREE.Group();
    tv.position.set(this.width * 0.24, 0, z);
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
    for (let index = 0; index < 4; index += 1) {
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.52 + index * 0.1, 0.05),
        new THREE.MeshBasicMaterial({ color: [0x86d8d0, 0xf0c477, 0xf48a7d, 0x9db7ff][index], transparent: true, opacity: 0.82 })
      );
      bar.position.set(-0.36 + index * 0.08, 1.48 + index * 0.14, -0.078);
      bar.rotation.y = Math.PI;
      tv.add(bar);
      this.screenBars.push(bar);
    }
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0x5de2b2 }));
    led.position.set(0.74, 1.38, -0.08);
    tv.add(led);
    this.lampLight = new THREE.PointLight(0x3e9ed3, 1.1, 4);
    this.lampLight.position.set(0, 1.6, -0.1);
    tv.add(this.lampLight);
    this.root.add(tv);

    const console = box(1.8, 0.22, 0.42, 0x6f584b, { roughness: 0.8 });
    console.position.set(this.width * 0.24, 0.82, z + 0.02);
    this.root.add(console);
  }

  _buildPassageNarrative() {
    const route = new THREE.Group();
    route.userData.kind = 'ergonomic-narrative';
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x6bb2b8, transparent: true, opacity: 0.13, depthWrite: false });
    const horizontal = new THREE.Mesh(new THREE.PlaneGeometry(this.width * 0.72, 0.42), floorMaterial);
    horizontal.rotation.x = -Math.PI / 2;
    horizontal.position.set(this.width / 2, 0.012, this.depth * 0.48);
    route.add(horizontal);
    const vertical = new THREE.Mesh(new THREE.PlaneGeometry(0.42, this.depth * 0.58), floorMaterial.clone());
    vertical.rotation.x = -Math.PI / 2;
    vertical.position.set(this.width * 0.73, 0.014, this.depth * 0.43);
    route.add(vertical);

    for (let index = 0; index < 7; index += 1) {
      const marker = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.09, 12), new THREE.MeshBasicMaterial({ color: 0xa3e5d7, transparent: true, opacity: 0.52, side: THREE.DoubleSide, depthWrite: false }));
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(this.width * 0.2 + index * this.width * 0.1, 0.022, this.depth * 0.48);
      route.add(marker);
    }
    const label = labelSprite('СВОБОДНЫЙ ПРОХОД', '#a8e8df');
    label.position.set(this.width * 0.68, 0.04, this.depth * 0.52);
    label.rotation.x = -Math.PI / 2;
    label.scale.set(1.45, 0.34, 1);
    route.add(label);
    this.root.add(route);
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
    this._time = time * 0.001;
    if (this.screen) {
      const pulse = 0.72 + Math.sin(this._time * 2.4) * 0.16;
      this.screen.material.color.setHSL(0.55 + Math.sin(this._time * 0.4) * 0.03, 0.5, 0.22 + pulse * 0.08);
      this.screen.material.opacity = 0.86 + pulse * 0.1;
    }
    this.screenBars.forEach((bar, index) => {
      bar.position.x = -0.36 + index * 0.08 + Math.sin(this._time * (1.3 + index * 0.2) + index) * 0.12;
      bar.material.opacity = 0.58 + (Math.sin(this._time * 2 + index) + 1) * 0.15;
    });
    if (this.lampLight) this.lampLight.intensity = 0.8 + (Math.sin(this._time * 2.4) + 1) * 0.24;
    if (this.pet) {
      const progress = (Math.sin(this._time * 0.34) + 1) / 2;
      this.pet.position.x = 1.0 + progress * (this.width - 2.0);
      this.pet.position.z = this.depth * 0.48 + Math.sin(this._time * 0.9) * 0.08;
      this.pet.position.y = Math.abs(Math.sin(this._time * 2.8)) * 0.025;
      this.pet.rotation.y = progress > 0.5 ? Math.PI : 0;
      this.pet.userData.tail.rotation.z = -0.85 + Math.sin(this._time * 5.5) * 0.3;
    }
    this.motes.forEach(mote => {
      mote.position.y += Math.sin(this._time * 0.7 + mote.userData.phase) * 0.0008;
      mote.material.opacity = 0.16 + (Math.sin(this._time * 1.2 + mote.userData.phase) + 1) * 0.08;
    });
  }

  destroy() {
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
