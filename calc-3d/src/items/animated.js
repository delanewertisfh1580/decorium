// =============================================================================
// items/animated.js — живые пропы Шага Б («живая сцена»).
// ТВ с CanvasTexture и сменой «каналов», кот/собака на патруле по
// CatmullRomCurve3, торшер с тёплым PointLight, покачивающееся растение.
// Пропы живут ВНЕ manager: не участвуют в drag/raycast/оценке.
// Вся расстановка — seeded (Rng), Math.random() отсутствует.
// =============================================================================

import * as THREE from 'three';

const MARGIN = 0.45; // отступ от стен для патрулей и угловых пропов

function std(color, roughness = 0.8, metalness = 0.0) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/** Замкнутая seeded-кривая патруля в границах комнаты. */
function makePatrolCurve(bounds, rng) {
    const n = rng.irange(4, 6);
    const pts = [];
    for (let i = 0; i < n; i++) {
        pts.push(new THREE.Vector3(
            rng.range(bounds.minX + MARGIN, bounds.maxX - MARGIN),
            0,
            rng.range(bounds.minZ + MARGIN, bounds.maxZ - MARGIN)
        ));
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
}

// -----------------------------------------------------------------------------
// ТВ: корпус + тумба + экран (CanvasTexture). Смена канала каждые ~1.5 с.
// -----------------------------------------------------------------------------
function createTV(rng) {
    const group = new THREE.Group();

    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.4), std(0x8a6a4a, 0.7));
    stand.position.y = 0.175;
    stand.castShadow = true;
    stand.receiveShadow = true;
    group.add(stand);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 0.06), std(0x1c1c22, 0.4, 0.3));
    body.position.y = 0.775;
    body.castShadow = true;
    group.add(body);

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.22, 0.67),
        new THREE.MeshBasicMaterial({ map: texture })
    );
    screen.position.set(0, 0.775, 0.035);
    group.add(screen);

    const palette = ['#7fb7be', '#e8c07d', '#b48ead', '#97c1a9', '#f2a65a'];

    // 4 процедурных «канала»; детерминированы от номера канала.
    function drawChannel(i) {
        const mode = i % 4;
        if (mode === 0) {
            const n = 6;
            for (let k = 0; k < n; k++) {
                ctx.fillStyle = palette[(k + i) % palette.length];
                ctx.fillRect((160 / n) * k, 0, 160 / n + 1, 96);
            }
        } else if (mode === 1) {
            const g = ctx.createLinearGradient(0, 0, 0, 96);
            g.addColorStop(0, '#aee1f2');
            g.addColorStop(1, '#97c1a9');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 160, 96);
            ctx.fillStyle = '#f7e08b';
            ctx.beginPath();
            ctx.arc(120, 26, 14, 0, Math.PI * 2);
            ctx.fill();
        } else if (mode === 2) {
            ctx.fillStyle = '#20242c';
            ctx.fillRect(0, 0, 160, 96);
            for (let k = 0; k < 220; k++) {
                const v = 40 + ((k * 37 + i * 101) % 180);
                ctx.fillStyle = `rgb(${v},${v},${v})`;
                ctx.fillRect((k * 53 + i * 29) % 160, (k * 31 + i * 17) % 96, 2, 2);
            }
        } else {
            ctx.fillStyle = palette[i % palette.length];
            ctx.fillRect(0, 0, 160, 96);
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillRect(30, 38, 100, 20);
        }
        texture.needsUpdate = true;
    }

    let channel = rng.irange(0, 3);
    let timer = 0;
    drawChannel(channel);

    return {
        group,
        update(dt) {
            timer += dt;
            if (timer >= 1.5) {
                timer = 0;
                channel += 1;
                drawChannel(channel);
            }
        }
    };
}

// -----------------------------------------------------------------------------
// Кот: патруль с фазами «иду/сижу», хвост sin(t).
// -----------------------------------------------------------------------------
function createCat(bounds, rng) {
    const group = new THREE.Group();
    const fur = std(0x9a7b5f, 0.9);

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.22, 4, 8), fur);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.14;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), fur);
    head.position.set(0.16, 0.2, 0);
    group.add(head);

    const earGeo = new THREE.ConeGeometry(0.03, 0.06, 6);
    const ear1 = new THREE.Mesh(earGeo, fur);
    ear1.position.set(0.15, 0.28, 0.035);
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, fur);
    ear2.position.set(0.15, 0.28, -0.035);
    group.add(ear2);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.28, 6), fur);
    tail.position.set(-0.22, 0.2, 0);
    tail.rotation.z = Math.PI / 2.5;
    group.add(tail);

    const curve = makePatrolCurve(bounds, rng);
    const len = curve.getLength();
    const SPEED = 0.35;
    const WALK_T = 6;
    const SIT_T = 2.5;

    let s = rng.range(0, 1);
    let mode = 'walk';
    let modeT = 0;

    return {
        group,
        update(dt, t) {
            modeT += dt;
            if (mode === 'walk' && modeT > WALK_T) { mode = 'sit'; modeT = 0; }
            else if (mode === 'sit' && modeT > SIT_T) { mode = 'walk'; modeT = 0; }

            if (mode === 'walk') {
                s = (s + (SPEED * dt) / len) % 1;
                const p = curve.getPointAt(s);
                const tan = curve.getTangentAt(s);
                group.position.set(p.x, 0, p.z);
                group.rotation.y = Math.atan2(-tan.z, tan.x);
                tail.rotation.z = Math.PI / 2.5 + Math.sin(t * 5) * 0.15;
            } else {
                tail.rotation.z = Math.PI / 2.5 + Math.sin(t * 2) * 0.05;
            }
        }
    };
}

// -----------------------------------------------------------------------------
// Собака: быстрее кота + «дыхание» scale.y.
// -----------------------------------------------------------------------------
function createDog(bounds, rng) {
    const group = new THREE.Group();
    const fur = std(0x7a6a55, 0.9);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.16), fur);
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.12), fur);
    head.position.set(0.22, 0.3, 0);
    group.add(head);

    const earGeo = new THREE.BoxGeometry(0.03, 0.08, 0.05);
    const ear1 = new THREE.Mesh(earGeo, std(0x5d4f3f, 0.9));
    ear1.position.set(0.2, 0.38, 0.05);
    group.add(ear1);
    const ear2 = ear1.clone();
    ear2.position.z = -0.05;
    group.add(ear2);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.18, 6), fur);
    tail.position.set(-0.2, 0.28, 0);
    tail.rotation.z = -Math.PI / 4;
    group.add(tail);

    const legGeo = new THREE.BoxGeometry(0.05, 0.14, 0.05);
    const legSpots = [[0.12, 0.06], [0.12, -0.06], [-0.12, 0.06], [-0.12, -0.06]];
    for (const [lx, lz] of legSpots) {
        const leg = new THREE.Mesh(legGeo, fur);
        leg.position.set(lx, 0.07, lz);
        group.add(leg);
    }

    const curve = makePatrolCurve(bounds, rng);
    const len = curve.getLength();
    const SPEED = 0.7;
    let s = rng.range(0, 1);

    return {
        group,
        update(dt, t) {
            s = (s + (SPEED * dt) / len) % 1;
            const p = curve.getPointAt(s);
            const tan = curve.getTangentAt(s);
            group.position.set(p.x, 0, p.z);
            group.rotation.y = Math.atan2(-tan.z, tan.x);
            tail.rotation.x = Math.sin(t * 8) * 0.3;
            group.scale.y = 1 + Math.sin(t * 3) * 0.02; // «дыхание»
        }
    };
}

// -----------------------------------------------------------------------------
// Торшер: стойка + абажур + тёплый PointLight (физические единицы r160).
// -----------------------------------------------------------------------------
function createFloorLamp() {
    const group = new THREE.Group();
    const dark = std(0x2e2e34, 0.5, 0.4);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16), dark);
    base.position.y = 0.02;
    group.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.35, 8), dark);
    pole.position.y = 0.715;
    group.add(pole);

    const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.22, 0.3, 16, 1, true),
        new THREE.MeshStandardMaterial({
            color: 0xf2e2c4,
            roughness: 0.9,
            side: THREE.DoubleSide,
            emissive: 0xffd9a0,
            emissiveIntensity: 0.25
        })
    );
    shade.position.y = 1.45;
    group.add(shade);

    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffd9a0, emissiveIntensity: 2 })
    );
    bulb.position.y = 1.42;
    group.add(bulb);

    const light = new THREE.PointLight(0xffd2a0, 6, 8, 2);
    light.position.y = 1.42;
    light.castShadow = false; // ради производительности
    group.add(light);

    return {
        group,
        update(dt, t) {
            light.intensity = 6 + Math.sin(t * 7.3) * 0.15; // лёгкое живое мерцание
        }
    };
}

// -----------------------------------------------------------------------------
// Растение: горшок + крона, покачивание ±0.02 рад.
// -----------------------------------------------------------------------------
function createPlant(rng) {
    const group = new THREE.Group();

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.22, 12), std(0xb0714f, 0.8));
    pot.position.y = 0.11;
    pot.castShadow = true;
    group.add(pot);

    const crown = new THREE.Group();
    const leafMat = std(0x5f8f5a, 0.9);
    const blobs = rng.irange(3, 5);
    for (let i = 0; i < blobs; i++) {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rng.range(0.09, 0.16), 0), leafMat);
        b.position.set(rng.range(-0.08, 0.08), 0.32 + rng.range(0, 0.25), rng.range(-0.08, 0.08));
        b.castShadow = true;
        crown.add(b);
    }
    group.add(crown);

    const phase = rng.range(0, Math.PI * 2);

    return {
        group,
        update(dt, t) {
            crown.rotation.z = Math.sin(t * 1.4 + phase) * 0.02;
            crown.rotation.x = Math.cos(t * 1.1 + phase) * 0.015;
        }
    };
}

// -----------------------------------------------------------------------------
// Публичный API: собрать набор пропов из task.anims.
// -----------------------------------------------------------------------------

/**
 * Создаёт живые пропы уровня и расставляет их по seeded-позициям.
 * @param {string[]} anims список из TaskContract ('tv','cat','dog','floorlamp','plant')
 * @param {object} bounds apartment.getBounds()
 * @param {import('../level/rng.js').Rng} rng seeded-поток для расстановки
 * @returns {{group: THREE.Group, update: (dt:number, t:number)=>void}}
 */
export function createProps(anims, bounds, rng) {
    const group = new THREE.Group();
    group.name = 'props';
    const updaters = [];

    const corners = [
        [bounds.minX + MARGIN, bounds.minZ + MARGIN],
        [bounds.maxX - MARGIN, bounds.minZ + MARGIN],
        [bounds.minX + MARGIN, bounds.maxZ - MARGIN],
        [bounds.maxX - MARGIN, bounds.maxZ - MARGIN]
    ];
    const freeCorners = rng.shuffle(corners);

    for (const kind of anims) {
        let prop = null;

        switch (kind) {
            case 'tv':
                prop = createTV(rng);
                prop.group.position.set(rng.range(-0.6, 0.6), 0, bounds.minZ + 0.3);
                break;
            case 'floorlamp': {
                const c = freeCorners.pop();
                if (c) {
                    prop = createFloorLamp();
                    prop.group.position.set(c[0], 0, c[1]);
                }
                break;
            }
            case 'plant': {
                const c = freeCorners.pop();
                if (c) {
                    prop = createPlant(rng);
                    prop.group.position.set(c[0], 0, c[1]);
                }
                break;
            }
            case 'cat':
                prop = createCat(bounds, rng);
                break;
            case 'dog':
                prop = createDog(bounds, rng);
                break;
            default:
                prop = null;
        }

        if (prop) {
            group.add(prop.group);
            updaters.push(prop.update);
        }
    }

    return {
        group,
        update(dt, t) {
            for (const u of updaters) u(dt, t);
        }
    };
}