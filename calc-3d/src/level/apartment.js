// =============================================================================
// level/apartment.js — комната вместо куба. Drop-in замена virtualBox.
// Стены/потолок — плоскости с нормалями ВНУТРЬ комнаты: внешняя камера видит
// интерьер (dollhouse), игрок видит пол/стены/окно/дверь/плинтус.
// API virtualBox сохранён: setTarget(w,h,d), update(dt), pulse(), getCur(),
// getTarget() + getBounds() для stacking.
// =============================================================================

import * as THREE from 'three';
import { getPalette } from './palettes.js';

const WALL_H = 3.0; // фиксированная высота потолка на уровень

/**
 * Строит комнату уровня из TaskContract и возвращает объект с API virtualBox.
 * @param {THREE.Scene} scene
 * @param {object} task TaskContract из level/task.js
 * @returns {object} drop-in замена virtualBox + getBounds()
 */
export function createApartment(scene, task) {
    const palette = getPalette(task.styleId);
    const room = task.rooms[0];
    const W = room.w;
    const D = room.d;
    const H = WALL_H;

    const group = new THREE.Group();
    group.name = 'apartment';
    scene.add(group);

    function makeMat(p) {
        return new THREE.MeshStandardMaterial({
            color: p.color,
            roughness: p.roughness,
            metalness: p.metalness,
            side: THREE.FrontSide
        });
    }

    // --- Пол (нормаль вверх) ---
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), makeMat(palette.floor));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    group.add(floor);

    // --- Потолок (нормаль вниз: снаружи не рендерится) ---
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), makeMat(palette.ceiling));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    group.add(ceil);

    // --- Стены-плоскости, нормали внутрь комнаты ---
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), makeMat(palette.walls));
    back.position.set(0, H / 2, -D / 2);
    back.receiveShadow = true;
    group.add(back);

    const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), makeMat(palette.walls));
    front.rotation.y = Math.PI;
    front.position.set(0, H / 2, D / 2);
    group.add(front);

    const left = new THREE.Mesh(new THREE.PlaneGeometry(D, H), makeMat(palette.walls));
    left.rotation.y = Math.PI / 2;
    left.position.set(-W / 2, H / 2, 0);
    left.receiveShadow = true;
    group.add(left);

    const right = new THREE.Mesh(new THREE.PlaneGeometry(D, H), makeMat(palette.walls));
    right.rotation.y = -Math.PI / 2;
    right.position.set(W / 2, H / 2, 0);
    group.add(right);

    // --- Окно на задней стене (видимо с дефолтной камеры) ---
    const winW = 1.8, winH = 1.4, winY = 1.6;
    const frameMat = makeMat(palette.windowFrame || palette.baseboard);
    const frameT = 0.06;

    const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(winW, winH),
        new THREE.MeshStandardMaterial({
            color: 0xbfe3f2,
            emissive: 0xbfe3f2,
            emissiveIntensity: 0.55,
            roughness: 0.1,
            metalness: 0.0,
            side: THREE.FrontSide
        })
    );
    glass.position.set(0, winY, -D / 2 + 0.02);
    group.add(glass);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(winW + frameT * 2, frameT, 0.05), frameMat);
    frameTop.position.set(0, winY + winH / 2 + frameT / 2, -D / 2 + 0.03);
    group.add(frameTop);

    const frameBottom = frameTop.clone();
    frameBottom.position.y = winY - winH / 2 - frameT / 2;
    group.add(frameBottom);

    const frameL = new THREE.Mesh(new THREE.BoxGeometry(frameT, winH, 0.05), frameMat);
    frameL.position.set(-winW / 2 - frameT / 2, winY, -D / 2 + 0.03);
    group.add(frameL);

    const frameR = frameL.clone();
    frameR.position.x = winW / 2 + frameT / 2;
    group.add(frameR);

    // --- Дверь на передней стене (тонкий бокс, видна изнутри) ---
    const doorW = 0.9, doorH = 2.1;
    const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.04), makeMat(palette.door));
    door.position.set(W / 2 - 1.0, doorH / 2, D / 2 - 0.03);
    group.add(door);

    const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.15, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 })
    );
    handle.position.set(W / 2 - 1.0 - doorW / 2 + 0.1, 1.0, D / 2 - 0.06);
    group.add(handle);

    // --- Плинтусы по периметру ---
    const bbH = 0.08, bbT = 0.02;
    const bbMat = makeMat(palette.baseboard);

    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(W, bbH, bbT), bbMat);
    bbBack.position.set(0, bbH / 2, -D / 2 + bbT / 2);
    group.add(bbBack);

    const bbFront = new THREE.Mesh(new THREE.BoxGeometry(W, bbH, bbT), bbMat);
    bbFront.position.set(0, bbH / 2, D / 2 - bbT / 2);
    group.add(bbFront);

    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, D), bbMat);
    bbLeft.position.set(-W / 2 + bbT / 2, bbH / 2, 0);
    group.add(bbLeft);

    const bbRight = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, D), bbMat);
    bbRight.position.set(W / 2 - bbT / 2, bbH / 2, 0);
    group.add(bbRight);

    // --- API virtualBox (drop-in) ---
    let pulseT = 0;

    return {
        group,

        // Размеры комнаты фиксированы уровнем; API сохраняем для совместимости.
        setTarget(w, h, d) { /* no-op: геометрия статична на уровень */ },

        update(dt) {
            if (pulseT > 0) {
                pulseT = Math.max(0, pulseT - dt);
                glass.material.emissiveIntensity = 0.55 + 0.35 * Math.sin(pulseT * 20);
            }
        },

        pulse() { pulseT = 0.5; },

        getCur() { return { w: W, h: H, d: D }; },
        getTarget() { return { w: W, h: H, d: D }; },

        /** Внутренние габариты для stacking/clamp. */
        getBounds() {
            return {
                minX: -W / 2, maxX: W / 2,
                minZ: -D / 2, maxZ: D / 2,
                minY: 0, maxY: H
            };
        }
    };
}