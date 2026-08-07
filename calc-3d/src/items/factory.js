import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ITEM_TYPES } from '../config.js';

function geoAt(geo, x, y, z, rx = 0, ry = 0, rz = 0) {
    const g = geo.clone();
    const m = new THREE.Matrix4();
    m.makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
    m.setPosition(x, y, z);
    g.applyMatrix4(m);
    return g;
}

function buildTable(w, d, h) {
    const topH = 0.05, legW = 0.05;
    const geos = [geoAt(new THREE.BoxGeometry(w, topH, d), 0, h - topH/2, 0)];
    const legH = h - topH;
    const offX = w/2 - legW/2 - 0.02, offZ = d/2 - legW/2 - 0.02;
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), -offX, legH/2, -offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW),  offX, legH/2, -offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW), -offX, legH/2,  offZ));
    geos.push(geoAt(new THREE.BoxGeometry(legW, legH, legW),  offX, legH/2,  offZ));
    return mergeGeometries(geos);
}

function buildSofa(w, d, h) {
    const baseH = h * 0.4, backH = h * 0.6, backT = 0.15, armW = 0.15;
    const geos = [];
    geos.push(geoAt(new THREE.BoxGeometry(w, baseH, d), 0, baseH/2, 0));
    geos.push(geoAt(new THREE.BoxGeometry(w, backH, backT), 0, baseH + backH/2, -d/2 + backT/2));
    geos.push(geoAt(new THREE.BoxGeometry(armW, backH * 0.6, d), -w/2 + armW/2, baseH + backH*0.3, 0));
    geos.push(geoAt(new THREE.BoxGeometry(armW, backH * 0.6, d),  w/2 - armW/2, baseH + backH*0.3, 0));
    return mergeGeometries(geos);
}

function buildLamp(w, d, h) {
    const baseH = 0.05, poleR = 0.03, shadeH = h * 0.3;
    const geos = [];
    geos.push(geoAt(new THREE.CylinderGeometry(w/2, w/2, baseH, 16), 0, baseH/2, 0));
    geos.push(geoAt(new THREE.CylinderGeometry(poleR, poleR, h - shadeH, 8), 0, baseH + (h-shadeH)/2, 0));
    geos.push(geoAt(new THREE.CylinderGeometry(w/4, w/2, shadeH, 16, 1, true), 0, h - shadeH/2, 0));
    return mergeGeometries(geos);
}

function buildFridge(w, d, h) {
    const geos = [geoAt(new THREE.BoxGeometry(w, h, d), 0, h/2, 0)];
    geos.push(geoAt(new THREE.BoxGeometry(w * 0.9, h * 0.45, 0.02), 0, h * 0.75, d/2 + 0.01));
    geos.push(geoAt(new THREE.BoxGeometry(w * 0.9, h * 0.45, 0.02), 0, h * 0.25, d/2 + 0.01));
    return mergeGeometries(geos);
}

function buildShelf(w, d, h, shelfLevels = 3) {
    const t = 0.05;
    const geos = [];
    geos.push(geoAt(new THREE.BoxGeometry(t, h, d), -w/2 + t/2, h/2, 0));
    geos.push(geoAt(new THREE.BoxGeometry(t, h, d),  w/2 - t/2, h/2, 0));
    geos.push(geoAt(new THREE.BoxGeometry(w, h, t), 0, h/2, -d/2 + t/2));
    const levels = Math.max(1, shelfLevels || 3);
    for (let i = 0; i <= levels; i++) {
        geos.push(geoAt(new THREE.BoxGeometry(w, t, d), 0, (h / levels) * i + t/2, 0));
    }
    return mergeGeometries(geos);
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

export function createItemMesh(type, id, w, d, h, shelfLevels) {
    const config = ITEM_TYPES[type] || ITEM_TYPES.box;
    const geometry = getGeometry(type, w, d, h, shelfLevels);

    const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: config.roughness !== undefined ? config.roughness : 0.5,
        metalness: config.metalness !== undefined ? config.metalness : 0.1
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

export function disposeMesh(mesh) {
    if (!mesh) return;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else mesh.material.dispose();
    }
}

export function rebuildItemGeometry(mesh, type, w, d, h, shelfLevels) {
    if (!mesh) return;
    if (mesh.geometry) mesh.geometry.dispose();
    const newGeo = getGeometry(type, w, d, h, shelfLevels);
    mesh.geometry = newGeo;
    newGeo.computeBoundingBox();
    mesh.position.y = -newGeo.boundingBox.min.y;
}