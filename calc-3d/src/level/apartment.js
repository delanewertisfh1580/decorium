// =============================================================================
// level/apartment.js — квартира из BSP-layout. Drop-in замена virtualBox.
// v3 (Фаза 3):
//  - кеширование материалов (один материал на палитру-слот, а не на меш);
//  - устранены копланарные грани (пол/потолок сдвинуты на EPS) — нет Z-fighting;
//  - статичные меши с замороженными матрицами (matrixAutoUpdate=false);
//  - pulse() — только по явному вызову, с затуханием, не трогает пол.
// API: setTarget/update/pulse/getCur/getTarget/getBounds/getRooms/
// getActiveRoom/setActiveRoom/roomAt/getFootprint.
// =============================================================================

import * as THREE from 'three';
import { getPalette } from './palettes.js';

const H = 3.0;
const WALL_T = 0.1;
const EPS = 0.004; // анти-Z-fighting зазор

export function createApartment(scene, task) {
    const palette = getPalette(task.styleId);
    const layout = task.layout || {
        rooms: [{ id: 'r0', type: 'living', x: 0, z: 0, w: task.rooms[0].w, d: task.rooms[0].d }],
        doors: [],
        W: task.rooms[0].w,
        D: task.rooms[0].d
    };
    const { rooms, doors, W, D } = layout;

    const group = new THREE.Group();
    group.name = 'apartment';
    scene.add(group);

    // --- Кеш материалов: один материал на слот палитры ---
    const matCache = new Map();
    function makeMat(slot) {
        const p = palette[slot];
        if (matCache.has(slot)) return matCache.get(slot);
        const m = new THREE.MeshStandardMaterial({
            color: p.color, roughness: p.roughness, metalness: p.metalness
        });
        matCache.set(slot, m);
        return m;
    }

    /** Статичный меш: позиция → updateMatrix → matrixAutoUpdate=false. */
    function addStatic(mesh) {
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
        return mesh;
    }

    // --- Пол и потолок (сдвинуты на EPS: ничто не копланарно стенам/плинтусам) ---
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), makeMat('floor'));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -EPS;
    floor.receiveShadow = true;
    addStatic(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), makeMat('ceiling'));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H + EPS;
    addStatic(ceil);

    // --- Внешние стены-плоскости, нормали внутрь (dollhouse) ---
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), makeMat('walls'));
    back.position.set(0, H / 2, -D / 2);
    back.receiveShadow = true;
    addStatic(back);

    const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), makeMat('walls'));
    front.rotation.y = Math.PI;
    front.position.set(0, H / 2, D / 2);
    addStatic(front);

    const left = new THREE.Mesh(new THREE.PlaneGeometry(D, H), makeMat('walls'));
    left.rotation.y = Math.PI / 2;
    left.position.set(-W / 2, H / 2, 0);
    left.receiveShadow = true;
    addStatic(left);

    const right = new THREE.Mesh(new THREE.PlaneGeometry(D, H), makeMat('walls'));
    right.rotation.y = -Math.PI / 2;
    right.position.set(W / 2, H / 2, 0);
    addStatic(right);

    // --- Внутренние стены с проёмами (низ/верх с отступом EPS от пола/потолка) ---
    const wallMat = makeMat('walls');
    const wallH = H - 2 * EPS;
    const wallY = EPS + wallH / 2;

    for (const door of doors) {
        const gapHalf = door.width / 2;
        const lo = Math.min(door.from - gapHalf, door.hi - 0.4);
        const hi = Math.max(door.from + gapHalf, door.lo + 0.4);

        const seg = (a, b) => {
            const len = b - a;
            if (len < 0.05) return null;
            const mid = (a + b) / 2;
            if (door.axis === 'x') {
                const m = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, wallH, len), wallMat);
                m.position.set(door.at, wallY, mid);
                m.castShadow = true;
                m.receiveShadow = true;
                return addStatic(m);
            }
            const m = new THREE.Mesh(new THREE.BoxGeometry(len, wallH, WALL_T), wallMat);
            m.position.set(mid, wallY, door.at);
            m.castShadow = true;
            m.receiveShadow = true;
            return addStatic(m);
        };

        seg(door.lo, lo);
        seg(hi, door.hi);

        // Перемычка над проёмом (верх не касается потолка: H-EPS)
        const lintelH = 0.5;
        if (door.axis === 'x') {
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, lintelH, hi - lo), wallMat);
            lintel.position.set(door.at, H - EPS - lintelH / 2, (lo + hi) / 2);
            addStatic(lintel);
        } else {
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(hi - lo, lintelH, WALL_T), wallMat);
            lintel.position.set((lo + hi) / 2, H - EPS - lintelH / 2, door.at);
            addStatic(lintel);
        }
    }

    // --- Окно в гостиной (статичный emissive, без пер-кадровых мутаций) ---
    const living = rooms.find((r) => r.type === 'living') || rooms[0];
    const winW = 1.8, winH = 1.4, winY = 1.6;
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0xbfe3f2, emissive: 0xbfe3f2, emissiveIntensity: 0.55, roughness: 0.1
    });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
    glass.position.set(living.x, winY, -D / 2 + 0.02);
    addStatic(glass);

    const frameMat = makeMat('baseboard');
    const ft = 0.06;
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(winW + ft * 2, ft, 0.05), frameMat);
    fTop.position.set(living.x, winY + winH / 2 + ft / 2, -D / 2 + 0.03);
    addStatic(fTop);
    const fBot = new THREE.Mesh(new THREE.BoxGeometry(winW + ft * 2, ft, 0.05), frameMat);
    fBot.position.set(living.x, winY - winH / 2 - ft / 2, -D / 2 + 0.03);
    addStatic(fBot);
    const fL = new THREE.Mesh(new THREE.BoxGeometry(ft, winH, 0.05), frameMat);
    fL.position.set(living.x - winW / 2 - ft / 2, winY, -D / 2 + 0.03);
    addStatic(fL);
    const fR = new THREE.Mesh(new THREE.BoxGeometry(ft, winH, 0.05), frameMat);
    fR.position.set(living.x + winW / 2 + ft / 2, winY, -D / 2 + 0.03);
    addStatic(fR);

    // --- Входная дверь ---
    const doorX = Math.max(-W / 2 + 1, Math.min(W / 2 - 1, living.x));
    const entry = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.04), makeMat('door'));
    entry.position.set(doorX, 1.05, D / 2 - 0.03);
    addStatic(entry);

    // --- Плинтусы (низ на EPS выше пола — не копланарны) ---
    const bbMat = makeMat('baseboard');
    const bbH = 0.08, bbT = 0.02, bbY = bbH / 2;
    const bb1 = new THREE.Mesh(new THREE.BoxGeometry(W, bbH, bbT), bbMat);
    bb1.position.set(0, bbY, -D / 2 + bbT / 2);
    addStatic(bb1);
    const bb2 = new THREE.Mesh(new THREE.BoxGeometry(W, bbH, bbT), bbMat);
    bb2.position.set(0, bbY, D / 2 - bbT / 2);
    addStatic(bb2);
    const bb3 = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, D), bbMat);
    bb3.position.set(-W / 2 + bbT / 2, bbY, 0);
    addStatic(bb3);
    const bb4 = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, D), bbMat);
    bb4.position.set(W / 2 - bbT / 2, bbY, 0);
    addStatic(bb4);

    // --- Активная комната и сдвиг мира ---
    let active = living;
    group.position.set(-active.x, 0, -active.z);

    let pulseT = 0;

    return {
        group,

        setTarget(w, h, d) { /* статично на уровень */ },

        update(dt) {
            // pulse — только по явному вызову, с плавным затуханием; пол не трогаем
            if (pulseT > 0) {
                pulseT = Math.max(0, pulseT - dt);
                glassMat.emissiveIntensity = 0.55 + 0.35 * Math.sin(pulseT * 12) * pulseT;
                if (pulseT === 0) glassMat.emissiveIntensity = 0.55;
            }
        },

        pulse() { pulseT = 0.6; },

        getCur() { return { w: active.w, h: H, d: active.d }; },
        getTarget() { return { w: active.w, h: H, d: active.d }; },

        getBounds() {
            return {
                minX: -active.w / 2 + 0.05, maxX: active.w / 2 - 0.05,
                minZ: -active.d / 2 + 0.05, maxZ: active.d / 2 - 0.05,
                minY: 0, maxY: H
            };
        },

        getRooms() { return rooms; },
        getActiveRoom() { return active; },
        getFootprint() { return { W, D }; },

        /**
         * Переключает активную комнату; возвращает дельту для синхронизации мешей.
         * @param {string} id
         * @returns {{dx: number, dz: number}}
         */
        setActiveRoom(id) {
            const next = rooms.find((r) => r.id === id) || active;
            const prev = active;
            active = next;
            group.position.set(-active.x, 0, -active.z);
            return { dx: prev.x - active.x, dz: prev.z - active.z };
        },

        /** Комната для мировых координат предмета (текущий фрейм). */
        roomAt(x, z) {
            const lx = x + active.x;
            const lz = z + active.z;
            for (const r of rooms) {
                if (Math.abs(lx - r.x) <= r.w / 2 + 0.05 && Math.abs(lz - r.z) <= r.d / 2 + 0.05) {
                    return r.id;
                }
            }
            let best = rooms[0], bd = Infinity;
            for (const r of rooms) {
                const d2 = (lx - r.x) ** 2 + (lz - r.z) ** 2;
                if (d2 < bd) { bd = d2; best = r; }
            }
            return best.id;
        }
    };
}