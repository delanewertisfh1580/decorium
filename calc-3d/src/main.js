import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as state from './domain/state.js';
import { createManager } from './items/manager.js';
import { createAnimation } from './items/animation.js';
import { initDashboard } from './ui/dashboard.js';
import { initSizePanel } from './ui/sizePanel.js';
import { initControls } from './controls/drag.js';
import { initLibrary } from './ui/library.js';
import { createEvaluateButton } from './ui/evaluateButton.js';
import { showFeedbackPanel, hideFeedbackPanel } from './ui/feedbackPanel.js';
import { runEvaluation } from './game/evaluator.js';
import { makeTask } from './level/task.js';
import { createApartment } from './level/apartment.js';

// 1. Сцена
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f2f5);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 1, 0);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

// 2. Генерация уровня (Шаг А)
const task = makeTask({ clientId: 'user1', levelId: 1 });
const apartment = createApartment(scene, task);

// 3. Системы
const animation = createAnimation();

const dashboard = initDashboard({
    getItems: () => state.getItems(),
    getMeshes: () => manager.getMeshes(),
    virtualBox: apartment // Drop-in
});

const manager = createManager({
    scene,
    virtualBox: apartment,
    animation,
    onChanged: recompute
});

const sizePanel = initSizePanel({
    virtualBox: apartment,
    onChanged: recompute
});

initControls({ camera, renderer, manager, orbit });
initLibrary({ manager });

const evalBtn = createEvaluateButton({
    onEvaluate: () => {
        const styleId = dashboard.getCurrentStyle();
        const result = runEvaluation({
            getItems: () => state.getItems(),
            getMeshes: () => manager.getMeshes(),
            virtualBox: apartment
        }, styleId);
        showFeedbackPanel(result, {
            onRetry: () => hideFeedbackPanel(),
            onContinue: () => hideFeedbackPanel()
        });
    }
});

// 4. Render-цикл
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    let dt = clock.getDelta();
    dt = Math.max(0, Math.min(0.05, dt));

    animation.update(dt);
    apartment.update(dt);
    orbit.update();

    renderer.render(scene, camera);
}

function recompute() {
    dashboard.update();
}

// 5. Финализация
recompute();
const loader = document.getElementById('loader');
if (loader) loader.style.display = 'none';

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();