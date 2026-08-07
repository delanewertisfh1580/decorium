// src/main.js (v2.4-StepA-resilient)
// Decorium. Точка входа.
// Устойчив к любому формату экспорта в модулях ядра движка (calc-3d).
// Если именованный экспорт отсутствует — используется default или no-op stub.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// === Импорт систем ===
import * as StateModule from './domain/state.js';
import * as ManagerModule from './items/manager.js';
import * as AnimationModule from './items/animation.js';
import * as DashboardModule from './ui/dashboard.js';
import * as ControlsModule from './controls/drag.js';
import * as LibraryModule from './ui/library.js';
import * as EvalButtonModule from './ui/evaluateButton.js';
import * as FeedbackModule from './ui/feedbackPanel.js';
import * as EvaluatorModule from './game/evaluator.js';

// === Импорт Decorium layer (Шаг А) ===
import { makeTask } from './level/task.js';
import { createApartment } from './level/apartment.js';

// ---------- Безопасные резолверы ----------
// Ядро движка нам неподконтрольно. Ищем функции во всех возможных местах.

function resolveFn(mod, names, fallback = () => {}) {
    if (!mod) return fallback;
    for (const name of names) {
        if (typeof mod[name] === 'function') return mod[name];
    }
    if (typeof mod.default === 'function') return mod.default;
    return fallback;
}

function resolveObj(mod, names, fallback = {}) {
    if (!mod) return fallback;
    for (const name of names) {
        if (mod[name] && typeof mod[name] === 'object') return mod[name];
    }
    if (mod.default && typeof mod.default === 'object') return mod.default;
    return fallback;
}

const getItems = resolveFn(StateModule, ['getItems'], () => []);

const createManager = resolveFn(
    ManagerModule,
    ['createManager'],
    () => ({
        addItem: () => {}, startDrag: () => {}, dragItem: () => {},
        endDrag: () => {}, resizeItem: () => {}, setShelfLevels: () => {},
        removeItem: () => {}, clear: () => {}, getMeshes: () => [],
        getMeshById: () => null
    })
);

function resolveAnimation() {
    const factory = resolveFn(AnimationModule, ['createAnimation'], null);
    if (factory) return factory();
    if (AnimationModule.default) {
        if (typeof AnimationModule.default === 'function') return AnimationModule.default();
        if (typeof AnimationModule.default.update === 'function') return AnimationModule.default;
    }
    if (AnimationModule.animation && typeof AnimationModule.animation.update === 'function') {
        return AnimationModule.animation;
    }
    console.warn('[main] items/animation.js: не найден update(dt), используется stub.');
    return { update: () => {}, add: () => {}, remove: () => {}, startSpawn: () => {} };
}

const initDashboard = resolveFn(
    DashboardModule,
    ['initDashboard'],
    () => ({ update: () => {}, hideLoader: () => {}, getCurrentStyle: () => 'scandinavian' })
);

const initControls = resolveFn(ControlsModule, ['initControls', 'setupControls', 'default'], () => {});
const initLibrary = resolveFn(LibraryModule, ['initLibrary', 'setupLibrary', 'default'], () => {});

const createEvaluateButton = resolveFn(
    EvalButtonModule,
    ['createEvaluateButton'],
    () => ({})
);

const Feedback = resolveObj(
    FeedbackModule,
    ['default'],
    { showFeedbackPanel: () => {}, hideFeedbackPanel: () => {} }
);
const showFeedbackPanel = typeof FeedbackModule.showFeedbackPanel === 'function'
    ? FeedbackModule.showFeedbackPanel
    : (typeof Feedback.showFeedbackPanel === 'function' ? Feedback.showFeedbackPanel : () => {});
const hideFeedbackPanel = typeof FeedbackModule.hideFeedbackPanel === 'function'
    ? FeedbackModule.hideFeedbackPanel
    : (typeof Feedback.hideFeedbackPanel === 'function' ? Feedback.hideFeedbackPanel : () => {});

const runEvaluation = resolveFn(
    EvaluatorModule,
    ['runEvaluation', 'evaluate'],
    () => ({ totalScore: 0, stars: 1, styleScore: 0, ergonomicsScore: 0, violations: [], empty: true })
);

// ---------- 1. Сцена и рендерер ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f2f5);

const camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 0.1, 100
);
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

// ---------- 2. Генерация уровня (Шаг А) ----------
const task = makeTask({ clientId: 'user1', levelId: 1 });
const apartment = createApartment(scene, task);

// ---------- 3. Системы ----------
const animation = resolveAnimation();

let manager = null;

const dashboard = initDashboard({
    getItems: () => getItems(),
    getMeshes: () => (manager ? manager.getMeshes() : []),
    virtualBox: apartment // drop-in замена virtualBox
});

manager = createManager({
    scene,
    virtualBox: apartment,
    animation,
    onChanged: recompute
});

// initControls и initLibrary — опциональны, вызываем безопасно
try { initControls({ camera, renderer, manager, orbit }); }
catch (e) { console.warn('[main] initControls failed:', e.message); }

try { initLibrary({ manager }); }
catch (e) { console.warn('[main] initLibrary failed:', e.message); }

try {
    createEvaluateButton({
        onEvaluate: () => {
            const styleId = (dashboard && typeof dashboard.getCurrentStyle === 'function')
                ? dashboard.getCurrentStyle()
                : task.styleId;
            const result = runEvaluation({
                getItems: () => getItems(),
                getMeshes: () => manager.getMeshes(),
                virtualBox: apartment
            }, styleId);
            showFeedbackPanel(result, {
                onRetry: () => hideFeedbackPanel(),
                onContinue: () => hideFeedbackPanel()
            });
        }
    });
} catch (e) {
    console.warn('[main] evaluateButton failed:', e.message);
}

// ---------- 4. Render-цикл (ЖЕЛЕЗНЫЙ КОНТРАКТ) ----------
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    let dt = clock.getDelta();
    dt = Math.max(0, Math.min(0.05, dt));

    if (animation && typeof animation.update === 'function') animation.update(dt);
    if (apartment && typeof apartment.update === 'function') apartment.update(dt);
    orbit.update();

    renderer.render(scene, camera);
}

function recompute() {
    if (dashboard && typeof dashboard.update === 'function') dashboard.update();
}

// ---------- 5. Финализация ----------
recompute();
if (dashboard && typeof dashboard.hideLoader === 'function') dashboard.hideLoader();
const loader = document.getElementById('loader');
if (loader) loader.style.display = 'none';

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();