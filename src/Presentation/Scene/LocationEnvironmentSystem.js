import * as THREE from 'three';
import LOCATION_LIFE_CONFIG from './locationLifeConfig.js';
import { getGaitPose, getRouteMotion } from './lifeAnimationConfig.js';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: options.roughness ?? 0.78, metalness: options.metalness ?? 0, emissive: options.emissive ?? 0x000000, emissiveIntensity: options.emissiveIntensity ?? 0 });
}
function box(width, height, depth, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, options));
  mesh.castShadow = options.castShadow ?? true; mesh.receiveShadow = options.receiveShadow ?? true; return mesh;
}
function cylinder(radiusTop, radiusBottom, height, color, options = {}, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material(color, options));
  mesh.castShadow = options.castShadow ?? true; mesh.receiveShadow = options.receiveShadow ?? true; return mesh;
}
function sphere(radius, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), material(color, options));
  mesh.castShadow = options.castShadow ?? true; mesh.receiveShadow = options.receiveShadow ?? true; return mesh;
}
function plane(width, depth, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material(color, options));
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = options.y ?? 0; mesh.receiveShadow = options.receiveShadow ?? true; return mesh;
}
function addWindow(parent, x, y, z, width = 1.2, height = 0.9) {
  const frame = box(width, height, 0.08, 0x473d3b, { roughness: 0.82 }); frame.position.set(x, y, z); parent.add(frame);
  const pane = box(width * .78, height * .7, .025, 0x8eb9bb, { roughness: .2, emissive: 0xf2bf75, emissiveIntensity: .48 }); pane.position.set(x, y, z - .055); parent.add(pane);
  const mullion = box(.035, height * .72, .035, 0x75604e, { castShadow: false }); mullion.position.set(x, y, z - .08); parent.add(mullion);
}
function createPedestrian(variant) {
  const colors = variant === 'green-coat' ? [0x658778, 0xc4a47b] : [0x9b766b, 0xe4c79b]; const person = new THREE.Group();
  const body = box(.22, .46, .16, colors[0], { roughness: .86 }); body.position.y = .58; person.add(body);
  const head = sphere(.12, 0xd6a37a); head.position.y = .94; person.add(head); const legs = []; const arms = [];
  for (const z of [-.055, .055]) { const leg = box(.065, .4, .07, 0x374655); leg.position.set(0, .2, z); person.add(leg); legs.push(leg); }
  for (const z of [-.14, .14]) { const arm = new THREE.Group(); arm.position.set(0, .79, z); const sleeve = box(.07, .22, .07, colors[0], { roughness: .86 }); sleeve.position.y = -.1; arm.add(sleeve); const hand = sphere(.045, 0xd6a37a, { roughness: .82 }); hand.position.y = -.25; arm.add(hand); person.add(arm); arms.push(arm); }
  const bag = box(.13, .2, .08, colors[1]); bag.position.set(-.16, .55, .05); person.add(bag); person.userData = { kind: 'street-pedestrian', legs, arms }; return person;
}
function createCar(variant) {
  const colors = { sage: 0x6e958d, ochre: 0xc08a55 }; const car = new THREE.Group(); const body = box(1.05, .26, .52, colors[variant] ?? colors.sage, { roughness: .42, metalness: .18 }); body.position.y = .28; car.add(body);
  const cabin = box(.54, .22, .42, 0x526979, { roughness: .25, metalness: .1 }); cabin.position.set(-.05, .5, 0); car.add(cabin); const wheels = [];
  for (const x of [-.34, .34]) for (const z of [-.25, .25]) { const wheel = cylinder(.1, .1, .07, 0x202832, { roughness: .92 }, 12); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .13, z); car.add(wheel); wheels.push(wheel); }
  car.userData = { kind: 'street-car', wheels }; return car;
}
function createStreetAnimal() {
  const animal = new THREE.Group(); const body = sphere(.16, 0xb97a55); body.scale.set(1.5, .8, .75); body.position.y = .2; animal.add(body); const head = sphere(.12, 0xc78c62); head.position.set(.2, .29, 0); animal.add(head); const legs = [];
  for (const x of [-.12, .12]) for (const z of [-.08, .08]) { const leg = box(.045, .18, .045, 0x825244); leg.position.set(x, .09, z); animal.add(leg); legs.push(leg); }
  const tail = cylinder(.025, .04, .25, 0x825244, {}, 8); tail.position.set(-.26, .3, 0); tail.rotation.z = -.85; animal.add(tail); animal.userData = { kind: 'street-animal', legs, tail }; return animal;
}
function routeZ(lane, depth) { if (lane === 'road-near') return depth + 2.25; if (lane === 'road-far') return depth + 2.9; return depth + 1.05; }

/** Owns only non-interactive exterior and atmosphere. Player interior belongs to RoomState. */
export class LocationEnvironmentSystem {
  constructor(scene, { width, depth, environmentPlan, config = LOCATION_LIFE_CONFIG }) {
    if (!environmentPlan) throw new Error('LocationEnvironmentSystem requires an environmentPlan.');
    this.scene = scene; this.width = width; this.depth = depth; this.environmentPlan = environmentPlan; this.config = config; this.destroyed = false;
    this.root = new THREE.Group(); this.root.userData.kind = 'location-environment'; this.root.userData.interiorOwnership = 'none'; this.routeEntities = [];
    this._buildEnvironment(); this._buildRoutes(); this.scene.add(this.root);
  }

  _buildEnvironment() {
    const exterior = this.environmentPlan.exterior; const composition = this.environmentPlan.exteriorComposition; const streetWidth = this.width + 8; const streetCenter = this.width / 2;
    const sidewalk = plane(streetWidth, 1.4, exterior.sidewalkColor, { y: -.018, roughness: .96 }); sidewalk.position.set(streetCenter, -.018, this.depth + 1.02); this.root.add(sidewalk);
    const road = plane(streetWidth, 2.45, exterior.roadColor, { y: -.025, roughness: .96 }); road.position.set(streetCenter, -.025, this.depth + 2.78); this.root.add(road);
    const curb = box(streetWidth, .12, .14, 0xc0a184, { roughness: .86 }); curb.position.set(streetCenter, .045, this.depth + 1.7); this.root.add(curb);
    for (let index = -2; index < 8; index += 1) { const marking = box(.75, .012, .06, 0xe1c889, { castShadow: false, receiveShadow: false }); marking.position.set(index * 1.8, .012, this.depth + 2.78); this.root.add(marking); }
    const facadeZ = this.depth + 4.25; const facade = box(this.width + 2.2, 3.4, .2, exterior.facadeColor, { roughness: .9 }); facade.position.set(streetCenter, 1.7, facadeZ); this.root.add(facade);
    addWindow(this.root, this.width * .26, 2.1, facadeZ - .14, 1.1, .84); addWindow(this.root, this.width * .74, 2.1, facadeZ - .14, 1.1, .84);
    for (const x of [.25, this.width + .35]) { const trunk = cylinder(.09, .12, 1.15, 0x6e5547, { roughness: .95 }); trunk.position.set(x, .57, this.depth + .75); this.root.add(trunk); const crown = sphere(.45 * composition.foliageScale, exterior.foliageColor, { roughness: .95 }); crown.position.set(x, 1.35, this.depth + .75); this.root.add(crown); }
    this._buildExteriorComposition(exterior, composition, facadeZ);
  }

  _buildExteriorComposition(exterior, composition, facadeZ) {
    const root = new THREE.Group(); root.userData = { kind: 'authored-exterior-composition', exteriorComposition: composition.kind }; this.root.add(root); const add = mesh => { root.add(mesh); return mesh; }; const center = this.width / 2;
    if (composition.kind === 'residential-porch') { const canopy = add(box(1.62, .12, .65, composition.accentColor, { roughness: .62 })); canopy.position.set(center, 1.92, facadeZ - .38); canopy.rotation.x = -.12; for (const x of [-.62, .62]) { const post = add(cylinder(.035, .04, 1.36, composition.facadeInsetColor, { roughness: .82 })); post.position.set(center + x, .68, facadeZ - .34); } }
    if (composition.kind === 'urban-cinema-block') { const marquee = add(box(this.width * .64, .18, .22, composition.accentColor, { roughness: .38, metalness: .25, emissive: composition.accentColor, emissiveIntensity: .12 })); marquee.position.set(center, 2.82, facadeZ - .25); }
    if (composition.kind === 'courtyard-workshop') { const arch = add(box(this.width * .54, .16, .26, composition.accentColor, { roughness: .7 })); arch.position.set(center, 2.7, facadeZ - .31); for (const x of [-this.width * .27, this.width * .27]) { const post = add(box(.13, 2, .18, composition.facadeInsetColor, { roughness: .86 })); post.position.set(center + x, 1, facadeZ - .3); } }
    void exterior;
  }

  getInteractableObjects() { return []; }
  moveFixture() { return false; }

  _buildRoutes() {
    const routeCount = Math.max(1, Math.ceil(this.config.routes.length * this.environmentPlan.exterior.routeScale));
    for (const route of this.config.routes.slice(0, routeCount)) { let entity; if (route.kind === 'pedestrian') entity = createPedestrian(route.variant); if (route.kind === 'car') entity = createCar(route.variant); if (route.kind === 'animal') entity = createStreetAnimal(); if (!entity) continue; entity.userData.route = route; entity.position.y = .02; entity.position.z = routeZ(route.lane, this.depth); entity.scale.setScalar(route.kind === 'pedestrian' ? .78 : route.kind === 'animal' ? .8 : .92); this.routeEntities.push(entity); this.root.add(entity); }
  }

  update(time) {
    const seconds = time * .001;
    for (const entity of this.routeEntities) { const route = entity.userData.route; const motion = getRouteMotion(seconds, route); const gait = route.kind === 'pedestrian' || route.kind === 'animal' ? getGaitPose(seconds, route.phase, route.kind) : null; entity.position.x = (route.start + (route.end - route.start) * motion.progress) * this.width; entity.position.z = routeZ(route.lane, this.depth) + (route.kind === 'animal' ? gait.bodySway : 0); entity.rotation.y = motion.direction < 0 ? Math.PI : 0; if (route.kind === 'pedestrian') { entity.userData.legs.forEach((leg, index) => { leg.rotation.z = gait.legs[index]; }); entity.userData.arms.forEach((arm, index) => { arm.rotation.z = gait.arms[index]; }); entity.position.y = .02 + gait.bodyBob; } if (route.kind === 'car') { const wheelAngle = -seconds * route.speed * 34; entity.userData.wheels.forEach(wheel => { wheel.rotation.z = wheelAngle; }); } if (route.kind === 'animal') { entity.userData.legs.forEach((leg, index) => { leg.rotation.z = gait.legs[index]; }); entity.userData.tail.rotation.z = -.85 + gait.tailSwing; entity.position.y = .02 + gait.bodyBob; } }
  }

  destroy() { this.destroyed = true; this.root.traverse(child => { child.geometry?.dispose(); if (Array.isArray(child.material)) child.material.forEach(value => value.dispose()); else child.material?.dispose(); }); this.scene.remove(this.root); }
}

export default LocationEnvironmentSystem;
