// src/items/factory.js
// Decorium. Фабрика предметов: параметрические префабы вместо простых боксов.
// Сохраняем основной контракт: createItemMesh, disposeMesh, rebuildItemGeometry.
// Дополнительно возвращаем setEmissive для controls/drag.js (подсветка при drag/hover).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ITEM_TYPES } from '../config.js';

/**
 * Создаёт клон геометрии и трансформирует её матрицей поворота/позиции.
 * @param {THREE.BufferGeometry} geo Исходная геометрия.
 * @param {number} x Позиция X.
 * @param {number} y Позиция Y.
 * @param {number} z Позиция Z.
 * @param {number} rx Поворот по X.
 * @param {number} ry Поворот по Y.
 * @param {number} rz Поворот по Z.
 * @returns {THREE.BufferGeometry}
 */
function geoAt(geo, x, y, z, rx = 0, ry = 0, rz = 0) {
    const g = geo.clone();
    const m = new THREE.Matrix4();
    m.makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
    m.setPosition(x, y, z);
    g.applyMatrix4(m);
    return g;
}

/**
 * Безопасно мерджит геометрии. Если merge не удался — возвращаем обычный box.
 * @param {THREE.BufferGeometry[]} geos
 * @param {number} w
 * @param {number} d
 * @param {number} h
 * @returns {THREE.BufferGeometry}
 */
function safeMerge(geos, w, d, h) {
    try {
        const merged = mergeGeometries(geos, false);
        if (merged) return merged;
    } catch (err) {
        console.warn('[factory] mergeGeometries failed, fallback to BoxGeometry', err);
    }
    return new THREE.BoxGeometry(w, h, d);
}

function buildTable(w, d, h) {
    const topH = 0.05;
    const legW = 0.05;
    const legH = Math.max(0.01, h - topH);
    const offX = Math.max(0.01, w / 2 - legW / 2 - 0.02);
    const offZ = Math.max(0.01, d / 2 - legW / 2 - 0.02);

    const geos = [];

    geos.push(geoAt(new THREE.BoxGeometry(w, topH, d), 0, h - topH / 2, 0));

    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), -offX, legH / 2, -offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), offX, legH / 2, -offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), -offX, legH / 2, offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), offX, legH / 2, offZ));

    return safeMerge(geos, w, d, h);
}

function buildSofa(w, d, h) {
    const baseH = h * 0.4;
    const backH = h * 0.6;
    const backT = Math.min(0.15, Math.max(0.05, d * 0.12));
    const armW = Math.min(0.15, Math.max(0.05, w * 0.08));

    const geos = [];

    // База
    geos.push(geoAt(new THREE.BoxGeometry(w, baseH, d), 0, baseH / 2, 0));

    // Спинка
    geos.push(geoAt(new THREE.BoxGeometry(w, backH, backT), 0, baseH + backH / 2, -d / 2 + backT / 2));

    // Подлокотники
    geos.push(geoAt(new THREE.BoxGeometry(armW, backH * 0.6, d), -w / 2 + armW / 2, baseH + backH * 0.3, 0));
    geos.push(geoAt(new THREE.BoxGeometry(armW, backH * 0.6, d), w / 2 - armW / 2, baseH + backH * 0.3, 0));

    // Подушки сиденья
    const cushionH = Math.max(0.04, baseH * 0.25);
    const cushionD = Math.max(0.2, d - backT - 0.05);
    const cushionW = Math.max(0.2, (w - armW * 2) / 2 - 0.02);

    geos.push(geoAt(
        new THREE.BoxGeometry(cushionW, cushionH, cushionD),
        -cushionW / 2 - 0.005,
        baseH + cushionH / 2,
        backT / 2
    ));

    geos.push(geoAt(
        new THREE.BoxGeometry(cushionW, cushionH, cushionD),
        cushionW / 2 + 0.005,
        baseH + cushionH / 2,
        backT / 2
    ));

    return safeMerge(geos, w, d, h);
}

function buildLamp(w, d, h) {
    const baseH = 0.05;
    const poleR = Math.max(0.015, Math.min(0.05, w * 0.06));
    const shadeH = Math.max(0.12, h * 0.3);
    const poleH = Math.max(0.01, h - shadeH - baseH);

    const geos = [];

    geos.push(geoAt(new THREE.CylinderGeometry(w / 2, w / 2, baseH, 16), 0, baseH / 2, 0));
    geos.push(geoAt(new THREE.CylinderGeometry(poleR, poleR, poleH, 8), 0, baseH + poleH / 2, 0));
    geos.push(geoAt(new THREE.CylinderGeometry(w / 4, w / 2, shadeH, 16, 1, true), 0, baseH + poleH + shadeH / 2, 0));

    return safeMerge(geos, w, d, h);
}

function buildFridge(w, d, h) {
    const geos = [];

    // Корпус
    geos.push(geoAt(new THREE.BoxGeometry(w, h, d), 0, h / 2, 0));

    // Передние панели в стиле media-panel / шкафа
    const panelT = 0.02;
    const panelZ = d / 2 + panelT / 2 - 0.001;

    geos.push(geoAt(new THREE.BoxGeometry(w * 0.88, h * 0.42, panelT), 0, h * 0.72, panelZ));
    geos.push(geoAt(new THREE.BoxGeometry(w * 0.88, h * 0.42, panelT), 0, h * 0.26, panelZ));

    // Ручка
    geos.push(geoAt(new THREE.BoxGeometry(0.03, h * 0.18, 0.03), w * 0.35, h * 0.72, panelZ + panelT));

    return safeMerge(geos, w, d, h);
}

function buildShelf(w, d, h, shelfLevels = 3) {
    const t = Math.max(0.03, Math.min(0.08, h * 0.03));
    const levels = Math.max(1, Math.floor(shelfLevels || 3));

    const geos = [];

    // Боковины
    geos.push(geoAt(new THREE.BoxGeometry(t, h, d), -w / 2 + t / 2, h / 2, 0));
    geos.push(geoAt(new THREE.BoxGeometry(t, h, d), w / 2 - t / 2, h / 2, 0));

    // Задняя стенка
    geos.push(geoAt(new THREE.BoxGeometry(w, h, t), 0, h / 2, -d / 2 + t / 2));

    // Полки
    for (let i = 0; i <= levels; i += 1) {
        const y = (h / levels) * i;
        geos.push(geoAt(new THREE.BoxGeometry(w, t, d), 0, y + t / 2, 0));
    }

    return safeMerge(geos, w, d, h);
}

function getGeometry(type, w, d, h, shelfLevels) {
    switch (type) {
        case 'box':
            return buildTable(w, d, h);
        case 'sofa':
            return buildSofa(w, d, h);
        case 'bike':
            return buildLamp(w, d, h);
        case 'fridge':
            return buildFridge(w, d, h);
        case 'shelf':
            return buildShelf(w, d, h, shelfLevels);
        default:
            return new THREE.BoxGeometry(w, h, d);
    }
}

/**
 * Устанавливает emissive для одного материала.
 * Поддерживает варианты вызова:
 * - setEmissive(mesh, 0x33ff33)
 * - setEmissive(mesh, 0x33ff33, 0.5)
 * - setEmissive(mesh, true)
 * - setEmissive(mesh, false)
 * - setEmissive(mesh, { color: 0x33ff33, intensity: 0.5 })
 * @param {THREE.Material} mat
 * @param {*} color
 * @param {number} [intensity]
 */
function setMaterialEmissive(mat, color, intensity) {
    if (!mat || !mat.emissive) return;

    const clear = () => {
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
        mat.needsUpdate = true;
    };

    if (
        color === false ||
        color === null ||
        color === undefined ||
        color === 0 ||
        color === '' ||
        color === 'off' ||
        color === 'none'
    ) {
        clear();
        return;
    }

    if (color === true) {
        mat.emissive.set(0x3366ff);
        mat.emissiveIntensity = typeof intensity === 'number' ? intensity : 0.35;
        mat.needsUpdate = true;
        return;
    }

    if (typeof color === 'object' && color !== null && !color.isColor) {
        if ('color' in color && color.color !== undefined) {
            mat.emissive.set(color.color);
        } else if ('r' in color && 'g' in color && 'b' in color) {
            mat.emissive.setRGB(color.r, color.g, color.b);
        } else if (mat.emissive.getHex() === 0) {
            mat.emissive.set(0x3366ff);
        }

        if (typeof color.intensity === 'number') {
            mat.emissiveIntensity = color.intensity;
        } else if (typeof intensity === 'number') {
            mat.emissiveIntensity = intensity;
        } else if (mat.emissiveIntensity === 0) {
            mat.emissiveIntensity = 0.3;
        }

        mat.needsUpdate = true;
        return;
    }

    mat.emissive.set(color);

    if (typeof intensity === 'number') {
        mat.emissiveIntensity = intensity;
    } else if (mat.emissiveIntensity === 0) {
        mat.emissiveIntensity = 0.3;
    }

    mat.needsUpdate = true;
}

/**
 * Включает/выключает emissive-подсветку меша или группы мешей.
 * Используется drag.js для hover/drag подсветки.
 * @param {THREE.Object3D|THREE.Mesh} mesh
 * @param {*} color Цвет, объект {color,intensity}, true/false.
 * @param {number} [intensity]
 */
export function setEmissive(mesh, color, intensity) {
    if (!mesh) return;

    const applyToObject = (obj) => {
        if (!obj || !obj.isMesh || !obj.material) return;

        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => setMaterialEmissive(mat, color, intensity));
    };

    if (mesh.isMesh) {
        applyToObject(mesh);
    }

    if (typeof mesh.traverse === 'function') {
        mesh.traverse((child) => {
            if (child !== mesh && child.isMesh) {
                applyToObject(child);
            }
        });
    }
}

/**
 * Создаёт меш предмета.
 * Контракт движка: mesh.userData.id обязан существовать.
 * @param {string} type
 * @param {string|number} id
 * @param {number} w
 * @param {number} d
 * @param {number} h
 * @param {number} [shelfLevels]
 * @returns {THREE.Mesh}
 */
export function createItemMesh(type, id, w, d, h, shelfLevels) {
    const config = ITEM_TYPES[type] || ITEM_TYPES.box;
    const geometry = getGeometry(type, w, d, h, shelfLevels);

    const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: config.roughness !== undefined ? config.roughness : 0.5,
        metalness: config.metalness !== undefined ? config.metalness : 0.1,
        emissive: 0x000000,
        emissiveIntensity: 0,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.id = id;
    mesh.userData.type = type;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    geometry.computeBoundingBox();
    mesh.position.y = -geometry.boundingBox.min.y;

    return mesh;
}

/**
 * Освобождает геометрию/материалы меша.
 * @param {THREE.Object3D|THREE.Mesh} mesh
 */
export function disposeMesh(mesh) {
    if (!mesh) return;

    const disposeSingle = (obj) => {
        if (!obj || !obj.isMesh) return;

        if (obj.geometry) {
            obj.geometry.dispose();
        }

        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach((m) => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
    };

    if (mesh.isMesh) {
        disposeSingle(mesh);
    }

    if (typeof mesh.traverse === 'function') {
        mesh.traverse((child) => {
            if (child !== mesh && child.isMesh) {
                disposeSingle(child);
            }
        });
    }
}

/**
 * Перестраивает геометрию существующего меша при resize.
 * @param {THREE.Mesh} mesh
 * @param {string} type
 * @param {number} w
 * @param {number} d
 * @param {number} h
 * @param {number} [shelfLevels]
 */
export function rebuildItemGeometry(mesh, type, w, d, h, shelfLevels) {
    if (!mesh) return;

    if (mesh.geometry) {
        mesh.geometry.dispose();
    }

    const newGeo = getGeometry(type, w, d, h, shelfLevels);
    mesh.geometry = newGeo;

    newGeo.computeBoundingBox();
    mesh.position.y = -newGeo.boundingBox.min.y;
}