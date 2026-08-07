// =============================================================================
// items/factory.js — фабрика предметов: параметрические префабы.
// Контракт: createItemMesh, disposeMesh, rebuildItemGeometry, setEmissive.
// setEmissive(mesh, intensity): 0 — выкл, 0.35 — hover, 0.5 — drag
// (контракт drag.js), цвет подсветки — спокойный синий.
// =============================================================================

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ITEM_TYPES } from '../config.js';

const HIGHLIGHT_COLOR = 0x4d8dff;

function geoAt(geo, x, y, z, rx = 0, ry = 0, rz = 0) {
    const g = geo.clone();
    const m = new THREE.Matrix4();
    m.makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
    m.setPosition(x, y, z);
    g.applyMatrix4(m);
    return g;
}

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
    const topH = 0.05, legW = 0.05;
    const legH = Math.max(0.01, h - topH);
    const offX = Math.max(0.01, w / 2 - legW / 2 - 0.02);
    const offZ = Math.max(0.01, d / 2 - legW / 2 - 0.02);
    const geos = [geoAt(new THREE.BoxGeometry(w, topH, d), 0, h - topH / 2, 0)];
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), -offX, legH / 2, -offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), offX, legH / 2, -offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), -offX, legH / 2, offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), offX, legH / 2, offZ));
    return safeMerge(geos, w, d, h);
}

function buildSofa(w, d, h) {
    const baseH = h * 0.4, backH = h * 0.6;
    const backT = Math.min(0.15, Math.max(0.05, d * 0.12));
    const armW = Math.min(0.15, Math.max(0.05, w * 0.08));
    const geos = [];
    geos.push(geoAt(new THREE.BoxGeometry(w, baseH, d), 0, baseH / 2, 0));
    geos.push(geoAt(new THREE.BoxGeometry(w, backH, backT), 0, baseH + backH / 2, -d / 2 + backT / 2));
    geos.push(geoAt(new THREE.BoxGeometry(armW, backH * 0.6, d), -w / 2 + armW / 2, baseH + backH * 0.3, 0));
    geos.push(geoAt(new THREE.BoxGeometry(armW, backH * 0.6, d), w / 2 - armW / 2, baseH + backH * 0.3, 0));
    const cushionH = Math.max(0.04, baseH * 0.25);
    const cushionD = Math.max(0.2, d - backT - 0.05);
    const cushionW = Math.max(0.2, (w - armW * 2) / 2 - 0.02);
    geos.push(geoAt(new THREE.BoxGeometry(cushionW, cushionH, cushionD), -cushionW / 2 - 0.005, baseH + cushionH / 2, backT / 2));
    geos.push(geoAt(new THREE.BoxGeometry(cushionW, cushionH, cushionD), cushionW / 2 + 0.005, baseH + cushionH / 2, backT / 2));
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
    const geos = [geoAt(new THREE.BoxGeometry(w, h, d), 0, h / 2, 0)];
    const panelT = 0.02;
    const panelZ = d / 2 + panelT / 2 - 0.001;
    geos.push(geoAt(new THREE.BoxGeometry(w * 0.88, h * 0.42, panelT), 0, h * 0.72, panelZ));
    geos.push(geoAt(new THREE.BoxGeometry(w * 0.88, h * 0.42, panelT), 0, h * 0.26, panelZ));
    geos.push(geoAt(new THREE.BoxGeometry(0.03, h * 0.18, 0.03), w * 0.35, h * 0.72, panelZ + panelT));
    return safeMerge(geos, w, d, h);
}

function buildShelf(w, d, h, shelfLevels = 3) {
    const t = Math.max(0.03, Math.min(0.08, h * 0.03));
    const levels = Math.max(1, Math.floor(shelfLevels || 3));
    const geos = [];
    geos.push(geoAt(new THREE.BoxGeometry(t, h, d), -w / 2 + t / 2, h / 2, 0));
    geos.push(geoAt(new THREE.BoxGeometry(t, h, d), w / 2 - t / 2, h / 2, 0));
    geos.push(geoAt(new THREE.BoxGeometry(w, h, t), 0, h / 2, -d / 2 + t / 2));
    for (let i = 0; i <= levels; i += 1) {
        geos.push(geoAt(new THREE.BoxGeometry(w, t, d), 0, (h / levels) * i + t / 2, 0));
    }
    return safeMerge(geos, w, d, h);
}

function getGeometry(type, w, d, h, shelfLevels) {
    switch (type) {
        case 'box': return buildTable(w, d, h);
        case 'sofa': return buildSofa(w, d, h);
        case 'bike': return buildLamp(w, d, h);
        case 'fridge': return buildFridge(w, d, h);
        case 'shelf': return buildShelf(w, d, h, shelfLevels);
        default: return new THREE.BoxGeometry(w, h, d);
    }
}

/**
 * Подсветка предмета по контракту drag.js: setEmissive(mesh, intensity).
 * intensity 0 — выкл; 0.35 — hover; 0.5 — перетаскивание.
 * @param {THREE.Object3D|THREE.Mesh} mesh
 * @param {number} intensity
 */
export function setEmissive(mesh, intensity) {
    if (!mesh) return;
    const value = typeof intensity === 'number' ? intensity : (intensity ? 0.35 : 0);

    const apply = (obj) => {
        if (!obj || !obj.isMesh || !obj.material) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
            if (!mat || !mat.emissive) continue;
            if (value <= 0) {
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 1;
            } else {
                mat.emissive.setHex(HIGHLIGHT_COLOR);
                mat.emissiveIntensity = value;
            }
        }
    };

    apply(mesh);
    if (typeof mesh.traverse === 'function') {
        mesh.traverse((child) => { if (child !== mesh) apply(child); });
    }
}

/**
 * Создаёт меш предмета. mesh.userData.id — контракт движка.
 */
export function createItemMesh(type, id, w, d, h, shelfLevels) {
    const config = ITEM_TYPES[type] || ITEM_TYPES.box;
    const geometry = getGeometry(type, w, d, h, shelfLevels);

    const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: config.roughness !== undefined ? config.roughness : 0.5,
        metalness: config.metalness !== undefined ? config.metalness : 0.1,
        emissive: 0x000000,
        emissiveIntensity: 1,
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
 */
export function disposeMesh(mesh) {
    if (!mesh) return;
    const disposeSingle = (obj) => {
        if (!obj || !obj.isMesh) return;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
        }
    };
    disposeSingle(mesh);
    if (typeof mesh.traverse === 'function') {
        mesh.traverse((child) => { if (child !== mesh) disposeSingle(child); });
    }
}

/**
 * Перестраивает геометрию существующего меша при ресайзе.
 */
export function rebuildItemGeometry(mesh, type, w, d, h, shelfLevels) {
    if (!mesh) return;
    if (mesh.geometry) mesh.geometry.dispose();
    const newGeo = getGeometry(type, w, d, h, shelfLevels);
    mesh.geometry = newGeo;
    newGeo.computeBoundingBox();
    mesh.position.y = -newGeo.boundingBox.min.y;
}