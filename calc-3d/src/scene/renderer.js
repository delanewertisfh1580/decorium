// =============================================================================
// scene/renderer.js — фабрика сцены (инфраструктурный слой).
// Контракт сохранён: initScene(canvas) → { renderer, scene, camera, orbit }.
// Лечение «мигающего пола»: shadow.bias/normalBias против shadow acne,
// PCFSoftShadowMap, sRGB + ACES для пастельной картинки GDD.
// =============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Создаёт renderer, сцену, камеру и orbit-контролы.
 * @param {HTMLCanvasElement} canvas
 * @returns {{renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, orbit: OrbitControls}}
 */
export function initScene(canvas) {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);

    const camera = new THREE.PerspectiveCamera(
        45, window.innerWidth / window.innerHeight, 0.1, 100
    );
    camera.position.set(6.5, 5.2, 6.8);

    const orbit = new OrbitControls(camera, canvas);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.target.set(0, 1, 0);
    orbit.maxPolarAngle = Math.PI * 0.49; // не ныряем под пол
    orbit.minDistance = 3;
    orbit.maxDistance = 18;

    // --- Мягкий «уютный» свет: hemisphere + тёплый directional ---
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8cfc4, 0.9);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfff2e0, 1.6);
    dir.position.set(6, 10, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -12;
    dir.shadow.camera.right = 12;
    dir.shadow.camera.top = 12;
    dir.shadow.camera.bottom = -12;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 30;
    // Ключ к лечению shadow acne («мигающий пол»):
    dir.shadow.bias = -0.0004;
    dir.shadow.normalBias = 0.03;
    scene.add(dir);

    return { renderer, scene, camera, orbit };
}