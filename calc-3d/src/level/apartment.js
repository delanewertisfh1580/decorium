import * as THREE from 'three';
import { getPalette } from './palettes.js';

export function createApartment(scene, task) {
    const palette = getPalette(task.styleId);
    const room = task.rooms[0];

    let currentW = room.w;
    let currentH = 3.0;
    let currentD = room.d;

    const group = new THREE.Group();
    group.name = 'Apartment';
    scene.add(group);

    const wallThickness = 0.15;

    function makeMat(p) {
        return new THREE.MeshStandardMaterial({
            color: p.color, roughness: p.roughness, metalness: p.metalness
        });
    }

    function buildRoom(w, h, d) {
        while(group.children.length > 0) {
            const child = group.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            group.remove(child);
        }

        const floorGeo = new THREE.BoxGeometry(w, 0.1, d);
        const floor = new THREE.Mesh(floorGeo, makeMat(palette.floor));
        floor.position.set(0, -0.05, 0);
        floor.receiveShadow = true;
        group.add(floor);

        const ceilGeo = new THREE.BoxGeometry(w, 0.1, d);
        const ceil = new THREE.Mesh(ceilGeo, makeMat(palette.ceiling));
        ceil.position.set(0, h + 0.05, 0);
        group.add(ceil);

        const backWallGeo = new THREE.BoxGeometry(w, h, wallThickness);
        const backWall = new THREE.Mesh(backWallGeo, makeMat(palette.walls));
        backWall.position.set(0, h/2, -d/2 + wallThickness/2);
        backWall.receiveShadow = true;
        group.add(backWall);

        const leftWallGeo = new THREE.BoxGeometry(wallThickness, h, d);
        const leftWall = new THREE.Mesh(leftWallGeo, makeMat(palette.walls));
        leftWall.position.set(-w/2 + wallThickness/2, h/2, 0);
        leftWall.receiveShadow = true;
        group.add(leftWall);

        const rightWallGeo = new THREE.BoxGeometry(wallThickness, h, d);
        const rightWall = new THREE.Mesh(rightWallGeo, makeMat(palette.walls));
        rightWall.position.set(w/2 - wallThickness/2, h/2, 0);
        rightWall.receiveShadow = true;
        group.add(rightWall);

        // Окно (справа)
        const winMat = new THREE.MeshStandardMaterial({
            color: 0x87ceeb, emissive: 0x87ceeb, emissiveIntensity: 0.5,
            roughness: 0.1, metalness: 0.9, side: THREE.DoubleSide
        });
        const windowPane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), winMat);
        windowPane.position.set(w/2 - wallThickness - 0.01, h/2 + 0.2, 0);
        windowPane.rotation.y = -Math.PI / 2;
        group.add(windowPane);

        const frontWallGeo = new THREE.BoxGeometry(w, h, wallThickness);
        const frontWall = new THREE.Mesh(frontWallGeo, makeMat(palette.walls));
        frontWall.position.set(0, h/2, d/2 - wallThickness/2);
        frontWall.receiveShadow = true;
        group.add(frontWall);

        // Дверь (спереди)
        const doorGeo = new THREE.BoxGeometry(0.9, 2.1, 0.05);
        const door = new THREE.Mesh(doorGeo, makeMat(palette.door));
        door.position.set(w/2 - 1.0, 2.1/2, d/2 - wallThickness - 0.025);
        group.add(door);

        // Плинтусы
        const bbMat = makeMat(palette.baseboard);
        const bb1 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.02), bbMat);
        bb1.position.set(0, 0.05, -d/2 + wallThickness + 0.01);
        group.add(bb1);
        
        const bb2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, d), bbMat);
        bb2.position.set(-w/2 + wallThickness + 0.01, 0.05, 0);
        group.add(bb2);
    }

    buildRoom(currentW, currentH, currentD);

    let targetW = currentW, targetH = currentH, targetD = currentD;
    let pulseTime = 0;

    return {
        group,
        setTarget(w, h, d) {
            targetW = w; targetH = h; targetD = d;
        },
        update(dt) {
            if (pulseTime > 0) pulseTime -= dt;
        },
        pulse() { pulseTime = 0.5; },
        getCur() { return { w: currentW, h: currentH, d: currentD }; },
        getTarget() { return { w: targetW, h: targetH, d: targetD }; },
        getBounds() {
            const w = currentW - wallThickness * 2;
            const d = currentD - wallThickness * 2;
            return {
                minX: -w / 2, maxX: w / 2,
                minZ: -d / 2, maxZ: d / 2,
                minY: 0, maxY: currentH
            };
        }
    };
}