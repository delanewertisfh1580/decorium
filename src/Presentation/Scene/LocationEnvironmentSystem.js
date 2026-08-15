import * as THREE from 'three';
import LOCATION_LIFE_CONFIG from './locationLifeConfig.js';
import { getFixtureLayout } from './FixtureLayout.js';
import { getGaitPose, getRouteMotion } from './lifeAnimationConfig.js';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function box(width, height, depth, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, options));
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function cylinder(radiusTop, radiusBottom, height, color, options = {}, segments = 16) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material(color, options)
  );
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function sphere(radius, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), material(color, options));
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function plane(width, depth, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material(color, options));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = options.y ?? 0;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function addWindow(parent, x, y, z, width = 1.2, height = 0.9) {
  const frame = box(width, height, 0.08, 0x473d3b, { roughness: 0.82 });
  frame.position.set(x, y, z);
  parent.add(frame);
  const pane = box(width * 0.78, height * 0.7, 0.025, 0x8eb9bb, {
    roughness: 0.2,
    emissive: 0xf2bf75,
    emissiveIntensity: 0.48
  });
  pane.position.set(x, y, z - 0.055);
  parent.add(pane);
  const mullion = box(0.035, height * 0.72, 0.035, 0x75604e, { castShadow: false });
  mullion.position.set(x, y, z - 0.08);
  parent.add(mullion);
}

function createPedestrian(variant) {
  const colors = variant === 'green-coat' ? [0x658778, 0xc4a47b] : [0x9b766b, 0xe4c79b];
  const person = new THREE.Group();
  const body = box(0.22, 0.46, 0.16, colors[0], { roughness: 0.86 });
  body.position.y = 0.58;
  person.add(body);
  const head = sphere(0.12, 0xd6a37a);
  head.position.y = 0.94;
  person.add(head);
  const legs = [];
  for (const z of [-0.055, 0.055]) {
    const leg = box(0.065, 0.4, 0.07, 0x374655);
    leg.position.set(0, 0.2, z);
    person.add(leg);
    legs.push(leg);
  }
  const arms = [];
  for (const z of [-0.14, 0.14]) {
    const arm = new THREE.Group();
    arm.position.set(0, 0.79, z);
    const sleeve = box(0.07, 0.22, 0.07, colors[0], { roughness: 0.86 });
    sleeve.position.y = -0.1;
    arm.add(sleeve);
    const hand = sphere(0.045, 0xd6a37a, { roughness: 0.82 });
    hand.position.y = -0.25;
    arm.add(hand);
    person.add(arm);
    arms.push(arm);
  }
  const bag = box(0.13, 0.2, 0.08, colors[1]);
  bag.position.set(-0.16, 0.55, 0.05);
  person.add(bag);
  person.userData.kind = 'street-pedestrian';
  person.userData.legs = legs;
  person.userData.arms = arms;
  return person;
}

function createCar(variant) {
  const colors = { sage: 0x6e958d, ochre: 0xc08a55 };
  const car = new THREE.Group();
  const body = box(1.05, 0.26, 0.52, colors[variant] ?? colors.sage, { roughness: 0.42, metalness: 0.18 });
  body.position.y = 0.28;
  car.add(body);
  const cabin = box(0.54, 0.22, 0.42, 0x526979, { roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.88 });
  cabin.position.set(-0.05, 0.5, 0);
  car.add(cabin);
  const wheels = [];
  for (const x of [-0.34, 0.34]) {
    for (const z of [-0.25, 0.25]) {
      const wheel = cylinder(0.1, 0.1, 0.07, 0x202832, { roughness: 0.92 }, 12);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.13, z);
      car.add(wheel);
      wheels.push(wheel);
    }
  }
  const headlight = box(0.06, 0.06, 0.14, 0xffe7ad, { emissive: 0xffbd61, emissiveIntensity: 0.9, castShadow: false });
  headlight.position.set(0.53, 0.31, -0.16);
  car.add(headlight);
  car.userData.kind = 'street-car';
  car.userData.wheels = wheels;
  return car;
}

function createStreetAnimal() {
  const animal = new THREE.Group();
  const body = sphere(0.16, 0xb97a55);
  body.scale.set(1.5, 0.8, 0.75);
  body.position.y = 0.2;
  animal.add(body);
  const head = sphere(0.12, 0xc78c62);
  head.position.set(0.2, 0.29, 0);
  animal.add(head);
  for (const z of [-0.07, 0.07]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 4), material(0x825244));
    ear.position.set(0.2, 0.41, z);
    ear.castShadow = true;
    animal.add(ear);
  }
  const legs = [];
  for (const x of [-0.12, 0.12]) {
    for (const z of [-0.08, 0.08]) {
      const leg = box(0.045, 0.18, 0.045, 0x825244);
      leg.position.set(x, 0.09, z);
      animal.add(leg);
      legs.push(leg);
    }
  }
  const tail = cylinder(0.025, 0.04, 0.25, 0x825244, {}, 8);
  tail.position.set(-0.26, 0.3, 0);
  tail.rotation.z = -0.85;
  animal.add(tail);
  animal.userData.kind = 'street-animal';
  animal.userData.legs = legs;
  animal.userData.tail = tail;
  return animal;
}

function createRestingCat() {
  const cat = new THREE.Group();
  const body = sphere(0.18, 0x8a7a73);
  body.scale.set(1.25, 0.68, 0.9);
  body.position.y = 0.2;
  cat.add(body);
  const head = sphere(0.14, 0x9a8980);
  head.position.set(0.16, 0.3, 0);
  cat.add(head);
  for (const z of [-0.07, 0.07]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 4), material(0x665b58));
    ear.position.set(0.14, 0.45, z);
    cat.add(ear);
  }
  const tail = cylinder(0.025, 0.035, 0.3, 0x665b58, {}, 8);
  tail.position.set(-0.2, 0.27, 0.04);
  tail.rotation.z = -1.1;
  cat.add(tail);
  cat.userData.kind = 'interior-resting-cat';
  cat.userData.tail = tail;
  return cat;
}

function routeZ(lane, depth) {
  if (lane === 'road-near') return depth + 2.25;
  if (lane === 'road-far') return depth + 2.9;
  return depth + (lane === 'sidewalk' ? 1.05 : 1.05);
}

export class LocationEnvironmentSystem {
  constructor(scene, { width, depth, environmentPlan, config = LOCATION_LIFE_CONFIG }) {
    if (!environmentPlan) throw new Error('LocationEnvironmentSystem requires an environmentPlan.');
    this.scene = scene;
    this.width = width;
    this.depth = depth;
    this.environmentPlan = environmentPlan;
    this.config = config;
    this.fixtureLayout = getFixtureLayout(width, depth);
    this.root = new THREE.Group();
    this.root.userData.kind = 'location-environment';
    this.routeEntities = [];
    this.interactiveFixtures = new Map();
    this.restingCat = null;
    this._buildEnvironment();
    this._buildInteriorDetails();
    this._buildRoutes();
    this.scene.add(this.root);
  }

  _buildEnvironment() {
    const exterior = this.environmentPlan.exterior;
    const streetWidth = this.width + 8;
    const streetCenter = this.width / 2;
    const sidewalk = plane(streetWidth, 1.4, exterior.sidewalkColor, { y: -0.018, roughness: 0.96 });
    sidewalk.position.set(streetCenter, -0.018, this.depth + 1.02);
    this.root.add(sidewalk);
    const road = plane(streetWidth, 2.45, exterior.roadColor, { y: -0.025, roughness: 0.96 });
    road.position.set(streetCenter, -0.025, this.depth + 2.78);
    this.root.add(road);

    const curb = box(streetWidth, 0.12, 0.14, 0xc0a184, { roughness: 0.86 });
    curb.position.set(streetCenter, 0.045, this.depth + 1.7);
    this.root.add(curb);
    for (let index = -2; index < 8; index += 1) {
      const marking = box(0.75, 0.012, 0.06, 0xe1c889, { castShadow: false, receiveShadow: false });
      marking.position.set(index * 1.8, 0.012, this.depth + 2.78);
      this.root.add(marking);
    }

    const facadeZ = this.depth + 4.25;
    const facade = box(this.width + 2.2, 3.4, 0.2, exterior.facadeColor, { roughness: 0.9 });
    facade.position.set(streetCenter, 1.7, facadeZ);
    this.root.add(facade);
    const trim = box(this.width + 2.35, 0.14, 0.27, 0xc4a983, { roughness: 0.65 });
    trim.position.set(streetCenter, 3.34, facadeZ - 0.03);
    this.root.add(trim);
    addWindow(this.root, this.width * 0.26, 2.1, facadeZ - 0.14, 1.1, 0.84);
    addWindow(this.root, this.width * 0.74, 2.1, facadeZ - 0.14, 1.1, 0.84);
    const door = box(0.72, 1.65, 0.05, 0x394b52, { roughness: 0.48 });
    door.position.set(streetCenter, 0.83, facadeZ - 0.14);
    this.root.add(door);
    const doorLight = new THREE.PointLight(0xffca82, 1.2, 3.5);
    doorLight.position.set(streetCenter, 1.8, facadeZ - 0.5);
    this.root.add(doorLight);
    const awning = box(1.25, 0.08, 0.52, 0x6c9287, { roughness: 0.62 });
    awning.position.set(streetCenter, 1.8, facadeZ - 0.35);
    awning.rotation.x = -0.12;
    this.root.add(awning);

    for (const x of [0.4, this.width - 0.4]) {
      const pole = cylinder(0.025, 0.025, 1.9, 0x35434a, { metalness: 0.4 });
      pole.position.set(x, 0.95, this.depth + 1.18);
      this.root.add(pole);
      const lamp = sphere(0.09, 0xffd08a, { emissive: 0xffb85c, emissiveIntensity: 0.8, castShadow: false });
      lamp.position.set(x, 1.92, this.depth + 1.18);
      this.root.add(lamp);
      const light = new THREE.PointLight(0xffbf70, 1.2, 3.5);
      light.position.copy(lamp.position);
      this.root.add(light);
    }

    for (const x of [0.25, this.width + 0.35]) {
      const trunk = cylinder(0.09, 0.12, 1.15, 0x6e5547, { roughness: 0.95 });
      trunk.position.set(x, 0.57, this.depth + 0.75);
      this.root.add(trunk);
      const crown = sphere(0.45, exterior.foliageColor, { roughness: 0.95 });
      crown.position.set(x, 1.35, this.depth + 0.75);
      this.root.add(crown);
    }
  }

  _hasFixture(fixtureId) {
    return this.environmentPlan.fixtures.includes(fixtureId);
  }

  _buildInteriorDetails() {
    if (this._hasFixture('mirror')) {
    const mirror = new THREE.Group();
    mirror.userData.fixtureId = 'ambient-mirror';
    mirror.userData.kind = 'ambient-fixture';
    mirror.userData.homeX = this.fixtureLayout.mirror.centerX;
    const artFrame = box(0.95, 0.7, 0.04, 0x5b4d46, { roughness: 0.72 });
    artFrame.position.set(0, 2.05, 0);
    mirror.add(artFrame);
    const art = box(0.62, 0.42, 0.018, 0x9fc4d5, { roughness: 0.16, transparent: true, opacity: 0.46, emissive: 0x17352e, emissiveIntensity: 0.08, castShadow: false });
    art.position.set(0, 2.05, -0.03);
    mirror.add(art);
    mirror.position.set(this.fixtureLayout.mirror.centerX, 0, this.fixtureLayout.mirror.z);
    this.root.add(mirror);
    this.interactiveFixtures.set(mirror.userData.fixtureId, mirror);
    }

    if (this._hasFixture('bookshelf')) {
    const bookshelf = new THREE.Group();
    bookshelf.userData.fixtureId = 'ambient-bookshelf';
    bookshelf.userData.kind = 'ambient-fixture';
    bookshelf.userData.homeX = this.fixtureLayout.bookshelf.centerX;
    const shelf = box(1.15, 0.08, 0.22, 0x987252, { roughness: 0.82 });
    shelf.position.set(0, 1.28, 0);
    bookshelf.add(shelf);
    for (let index = 0; index < 4; index += 1) {
      const book = box(0.12, 0.28 + (index % 2) * 0.08, 0.18, [0x9d7167, 0x6e8f83, 0xc39a62, 0x75889a][index], { roughness: 0.88 });
      book.position.set(-0.36 + index * 0.2, 1.47 + (index % 2) * 0.04, 0);
      book.rotation.z = (index - 1.5) * 0.04;
      bookshelf.add(book);
    }
    const mug = cylinder(0.09, 0.09, 0.12, 0xd9d0bc, { roughness: 0.5 }, 16);
    mug.position.set(0.4, 1.38, 0);
    bookshelf.add(mug);
    bookshelf.position.set(this.fixtureLayout.bookshelf.centerX, 0, this.fixtureLayout.bookshelf.z);
    this.root.add(bookshelf);
    this.interactiveFixtures.set(bookshelf.userData.fixtureId, bookshelf);
    }

    if (this._hasFixture('resting-cat')) {
    const bedBase = cylinder(0.42, 0.42, 0.11, 0x836c62, { roughness: 0.9 }, 24);
    bedBase.position.set(this.width * 0.14, 0.07, this.depth * 0.24);
    this.root.add(bedBase);
    const cushion = cylinder(0.33, 0.33, 0.07, 0xc29b88, { roughness: 0.96 }, 24);
    cushion.position.set(this.width * 0.14, 0.15, this.depth * 0.24);
    this.root.add(cushion);
    for (const x of [this.width * 0.04, this.width * 0.24]) {
      const bowl = cylinder(0.09, 0.11, 0.045, 0xd3a458, { metalness: 0.18, roughness: 0.52 }, 16);
      bowl.position.set(x, 0.025, this.depth * 0.32);
      this.root.add(bowl);
    }
    this.restingCat = createRestingCat();
    this.restingCat.position.set(this.width * 0.14, 0.16, this.depth * 0.24);
    this.root.add(this.restingCat);
    }

    this._buildProfileDecor();
  }

  _buildProfileDecor() {
    if (this._hasFixture('accent-wall-art')) {
      const frame = box(1.25, 0.82, 0.05, 0x302c35, { roughness: 0.7 });
      frame.position.set(this.width * 0.75, 1.85, this.depth - 0.12);
      this.root.add(frame);
      const panel = box(1.02, 0.6, 0.02, 0x9c6a74, { emissive: 0x3c1728, emissiveIntensity: 0.12, castShadow: false });
      panel.position.set(this.width * 0.75, 1.85, this.depth - 0.16);
      this.root.add(panel);
    }
    if (this._hasFixture('low-bookshelf')) {
      const shelf = box(1.45, 0.62, 0.28, 0x4b3f3d, { roughness: 0.8 });
      shelf.position.set(this.width * 0.2, 0.31, this.depth - 0.26);
      this.root.add(shelf);
    }
    if (this._hasFixture('studio-planter')) {
      const pot = cylinder(0.28, 0.34, 0.5, 0xc7ad86, { roughness: 0.9 }, 20);
      pot.position.set(this.width - 0.56, 0.25, this.depth - 0.48);
      this.root.add(pot);
      for (const [x, y] of [[-0.16, 0.82], [0.1, 1.08], [0.16, 0.76]]) {
        const leaf = sphere(0.22, this.environmentPlan.exterior.foliageColor, { roughness: 0.94 });
        leaf.scale.set(0.75, 1.55, 0.42);
        leaf.position.set(this.width - 0.56 + x, y, this.depth - 0.48);
        this.root.add(leaf);
      }
    }
    if (this._hasFixture('gallery-shelf')) {
      const shelf = box(1.7, 0.09, 0.25, 0x8f8273, { roughness: 0.86 });
      shelf.position.set(this.width * 0.28, 1.48, this.depth - 0.12);
      this.root.add(shelf);
    }
  }

  getInteractableObjects() {
    return [...this.interactiveFixtures.values()];
  }

  moveFixture(fixtureId, x) {
    const fixture = this.interactiveFixtures.get(fixtureId);
    if (!fixture) return false;
    const halfWidth = fixtureId === 'ambient-bookshelf' ? this.fixtureLayout.bookshelf.width / 2 : this.fixtureLayout.mirror.width / 2;
    const boundedX = THREE.MathUtils.clamp(x, halfWidth, this.width - halfWidth);
    fixture.position.x = boundedX - fixture.userData.homeX;
    return true;
  }

  _buildRoutes() {
    const routeCount = Math.max(1, Math.ceil(this.config.routes.length * this.environmentPlan.exterior.routeScale));
    for (const route of this.config.routes.slice(0, routeCount)) {
      let entity;
      if (route.kind === 'pedestrian') entity = createPedestrian(route.variant);
      if (route.kind === 'car') entity = createCar(route.variant);
      if (route.kind === 'animal') entity = createStreetAnimal();
      if (!entity) continue;
      entity.userData.route = route;
      entity.position.y = 0.02;
      entity.position.z = routeZ(route.lane, this.depth);
      entity.scale.setScalar(route.kind === 'pedestrian' ? 0.78 : route.kind === 'animal' ? 0.8 : 0.92);
      this.routeEntities.push(entity);
      this.root.add(entity);
    }
  }

  update(time) {
    const seconds = time * 0.001;
    for (const entity of this.routeEntities) {
      const route = entity.userData.route;
      const motion = getRouteMotion(seconds, route);
      const normalizedX = route.start + (route.end - route.start) * motion.progress;
      const gait = route.kind === 'pedestrian' || route.kind === 'animal'
        ? getGaitPose(seconds, route.phase, route.kind)
        : null;
      entity.position.x = normalizedX * this.width;
      entity.position.z = routeZ(route.lane, this.depth) + (route.kind === 'animal' ? gait.bodySway : 0);
      entity.rotation.y = motion.direction < 0 ? Math.PI : 0;

      if (route.kind === 'pedestrian') {
        entity.userData.legs.forEach((leg, index) => {
          leg.rotation.z = gait.legs[index];
        });
        entity.userData.arms.forEach((arm, index) => {
          arm.rotation.z = gait.arms[index];
        });
        entity.position.y = 0.02 + gait.bodyBob;
      }
      if (route.kind === 'car') {
        const wheelAngle = -seconds * route.speed * 34;
        entity.userData.wheels.forEach(wheel => { wheel.rotation.z = wheelAngle; });
      }
      if (route.kind === 'animal') {
        entity.userData.legs.forEach((leg, index) => {
          leg.rotation.z = gait.legs[index];
        });
        entity.userData.tail.rotation.z = -0.85 + gait.tailSwing;
        entity.position.y = 0.02 + gait.bodyBob;
      }
    }
    if (this.restingCat) {
      this.restingCat.userData.tail.rotation.z = -1.1 + Math.sin(seconds * 1.7) * 0.12;
      this.restingCat.position.y = 0.16 + Math.sin(seconds * 0.8) * 0.008;
    }
  }

  destroy() {
    this.root.traverse(child => {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach(value => value.dispose());
      else child.material?.dispose();
    });
    this.scene.remove(this.root);
  }
}

export default LocationEnvironmentSystem;
