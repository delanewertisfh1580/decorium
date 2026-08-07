// =============================================================================
// level/apartment.js — квартира из BSP-layout. Drop-in замена virtualBox.
// Ключевой приём Шага В: АКТИВНАЯ комната всегда центрирована в нуле мира
// (group.position = -center(active)) — математика stacking/clamp движка,
// рассчитанная на центр-в-нуле, работает per-room без правок ядра.
// API: setTarget/update/pulse/getCur/getTarget + getBounds/getRooms/
// getActiveRoom/setActiveRoom/roomAt/getFootprint.
// =============================================================================

import * as THREE from 'three';
import { getPalette } from './palettes.js';

const H = 3.0;
const WALL_T = 0.1;

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

    function makeMat(p) {
        return new THREE.MeshStandardMaterial({ color: p.color, roughness: p.roughness, metalness: p.metalness });
    }

    // --- Пол и потолок футпринта (dollhouse: потолок снаружи не виден) ---
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), makeMat(palette.floor));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), makeMat(palette.ceiling));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    group.add(ceil);

    // --- Внешние стены-плоскости, нормали внутрь ---
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

    // --- Внутренние стены с дверными проёмами ---
    const wallMat = makeMat(palette.walls);
    for (const door of doors) {
        const gapHalf = door.width / 2;
        const lo = Math.min(door.from - gapHalf, door.hi - 0.4);
        const hi = Math.max(door.from + gapHalf, door.lo + 0.4);

        const seg = (a, b) => {
            const len = b - a;
            if (len < 0.05) return null;
            const mid = (a + b) / 2;
            if (door.axis === 'x') {
                const m = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, H, len), wallMat);
                m.position.set(door.at, H / 2, mid);
                return m;
            }
            const m = new THREE.Mesh(new THREE.BoxGeometry(len, H, WALL_T), wallMat);
            m.position.set(mid, H / 2, door.at);
            return m;
        };

        const s1 = seg(door.lo, lo);
        if (s1) group.add(s1);
        const s2 = seg(hi, door.hi);
        if (s2) group.add(s2);

        // Перемычка над проёмом
        if (door.axis === 'x') {
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, 0.5, hi - lo), wallMat);
            lintel.position.set(door.at, H - 0.25, (lo + hi) / 2);
            group.add(lintel);
        } else {
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(hi - lo, 0.5, WALL_T), wallMat);
            lintel.position.set((lo + hi) / 2, H - 0.25, door.at);
            group.add(lintel);
        }
    }

    // --- Окно в гостиной (задняя стена) ---
    const living = rooms.find((r) => r.type === 'living') || rooms[0];
    const winW = 1.8, winH = 1.4, winY = 1.6;
    const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(winW, winH),
        new THREE.MeshStandardMaterial({
            color: 0xbfe3f2, emissive: 0xbfe3f2, emissiveIntensity: 0.55, roughness: 0.1
        })
    );
    glass.position.set(living.x, winY, -D / 2 + 0.02);
    group.add(glass);

    const frameMat = makeMat(palette.baseboard);
    const ft = 0.06;
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(winW + ft * 2, ft, 0.05), frameMat);
    fTop.position.set(living.x, winY + winH / 2 + ft / 2, -D / 2 + 0.03);
    group.add(fTop);
    const fBot = fTop.clone();
    fBot.position.y = winY - winH / 2 - ft / 2;
    group.add(fBot);
    const fL = new THREE.Mesh(new THREE.BoxGeometry(ft, winH, 0.05), frameMat);
    fL.position.set(living.x - winW / 2 - ft / 2, winY, -D / 2 + 0.03);
    group.add(fL);
    const fR = fL.clone();
    fR.position.x = living.x + winW / 2 + ft / 2;
    group.add(fR);

    // --- Входная дверь (передняя стена) ---
    const doorX = Math.max(-W / 2 + 1, Math.min(W / 2 - 1, living.x));
    const entry = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.04), makeMat(palette.door));
    entry.position.set(doorX, 1.05, D / 2 - 0.03);
    group.add(entry);

    // --- Плинтусы по периметру ---
    const bbMat = makeMat(palette.baseboard);
    const bbH = 0.08, bbT = 0.02;
    const bb1 = new THREE.Mesh(new THREE.BoxGeometry(W, bbH, bbT), bbMat);
    bb1.position.set(0, bbH / 2, -D / 2 + bbT / 2);
    group.add(bb1);
    const bb2 = new THREE.Mesh(new THREE.BoxGeometry(W, bbH, bbT), bbMat);
    bb2.position.set(0, bbH / 2, D / 2 - bbT / 2);
    group.add(bb2);
    const bb3 = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, D), bbMat);
    bb3.position.set(-W / 2 + bbT / 2, bbH / 2, 0);
    group.add(bb3);
    const bb4 = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, D), bbMat);
    bb4.position.set(W / 2 - bbT / 2, bbH / 2, 0);
    group.add(bb4);

    // --- Активная комната и сдвиг мира ---
    let active = living;
    group.position.set(-active.x, 0, -active.z);

    let pulseT = 0;

    return {
        group,

        setTarget(w, h, d) { /* статично на уровень */ },

        update(dt) {
            if (pulseT > 0) {
                pulseT = Math.max(0, pulseT - dt);
                glass.material.emissiveIntensity = 0.55 + 0.35 * Math.sin(pulseT * 20);
            }
        },

        pulse() { pulseT = 0.5; },

        /** Габариты АКТИВНОЙ комнаты (мир центрирован по ней). */
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
         * Переключает активную комнату; мир сдвигается так, чтобы она была
         * центрирована в нуле. Возвращает дельту для синхронизации мешей.
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