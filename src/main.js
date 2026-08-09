// =============================================================================
// main.js v8 (финальная DDD-сборка) — тонкий композиционный корень.
// Ноль импортов domain/state: всё через репозитории DecoriumApp.
// Направление: domain ← application ← infrastructure/ui ← main.
// =============================================================================

import * as THREE from 'three';
import { initScene } from './scene/renderer.js';
import { createManager } from './items/manager.js';
import * as animation from './items/animation.js';
import { initControls } from './controls/drag.js';
import { initLibrary } from './ui/library.js';
import { createSizePanel } from './ui/sizePanel.js';
import { createEvaluateButton } from './ui/evaluateButton.js';
import { showFeedbackPanel, hideFeedbackPanel } from './ui/feedbackPanel.js';
import { initDashboard } from './ui/dashboard.js';
import { createRoomTabs } from './ui/roomTabs.js';
import { createClientBrief } from './ui/clientBrief.js';
import { makeLevel } from './level/levelLoader.js';
import { createApartment } from './level/apartment.js';
import { createProps } from './items/animated.js';
import { createDecoriumApp } from './application/DecoriumApp.js';
import { pickClientPersona, clientTier } from './level/tone.js';
import { Rng } from './level/rng.js';

// =============================================================================
// 1. Уровень (декларативный пайплайн: seed → JSON → схема → TaskContract)
// =============================================================================
const params = new URLSearchParams(location.search);
const levelId = Math.max(1, parseInt(params.get('level') || '8', 10) || 8);
const clientId = params.get('client') || 'user1';
const { task } = makeLevel({ clientId, levelId });

// =============================================================================
// 2. Сцена и пространство
// =============================================================================
const canvas = document.getElementById('scene');
const { renderer, scene, camera, orbit } = initScene(canvas);
orbit.target.set(0, 1, 0);

const apartment = createApartment(scene, task);
const props = createProps(task.anims, apartment.getBounds(), new Rng(task.seed + '·props'));
scene.add(props.group);

// =============================================================================
// 3. Application-ядро (домен) — пространство инжектится интерфейсом
// =============================================================================
const app = createDecoriumApp({ spaceProvider: apartment });

// Персональные пороги клиента (GDD: b_i += rand[-0.1,+0.1]), детерминированно.
// Регистрируем лениво под каждый выбранный базовый стиль.
function personalStyleIdFor(styleId) {
    const pid = styleId + '__client';
    if (!app.styles.getById(pid)) {
        const base = app.styles.getById(styleId);
        if (base) {
            app.styles.register(base.withVariedThresholds(new Rng(task.seed + '·var·' + styleId)));
        }
    }
    return app.styles.getById(pid) ? pid : styleId;
}

function evaluateNow(styleId) {
    return app.evaluate({ styleId: personalStyleIdFor(styleId), wishes: task.wishes });
}

// =============================================================================
// 4. UI-адаптеры (оценка — через инъекцию, без легаси-импортов)
// =============================================================================
const dashboard = initDashboard({
    evaluate: (styleId) => evaluateNow(styleId),
    styleList: () => app.styleList()
});

const manager = createManager({
    scene,
    virtualBox: apartment,
    animation,
    onChanged: recompute
});

const sizePanel = createSizePanel({
    onResize: manager.resizeItem,
    onShelfLevels: manager.setShelfLevels,
    getItem: (id) => app.items.getRaw(id)
});

initControls({
    camera,
    domElement: canvas,
    orbit,
    manager,
    onSelect: (id) => {
        if (id === null) {
            sizePanel.close();
            hideFeedbackPanel();
            return;
        }
        const record = app.items.getRaw(id);
        if (record) sizePanel.open(id, record);
    }
});

initLibrary({
    onAdd: manager.addItem,
    onClear: () => {
        sizePanel.close();
        hideFeedbackPanel();
        manager.clear();
    }
});

// --- Табы комнат + переезд мира (меши — инфраструктура, записи — репозиторий) ---
let camGoal = null;
function goalFor(room) {
    return new THREE.Vector3(room.w * 0.6 + 2.2, 4.4, room.d * 0.6 + 2.6);
}

const tabs = createRoomTabs({
    rooms: apartment.getRooms(),
    onSelect: (id) => {
        if (id === apartment.getActiveRoom().id) return;
        const { dx, dz } = apartment.setActiveRoom(id);

        if (dx !== 0 || dz !== 0) {
            for (const mesh of manager.getMeshes()) {
                mesh.position.x += dx;
                mesh.position.z += dz;
            }
            app.relocateAllItems(dx, dz);
            props.group.position.x += dx;
            props.group.position.z += dz;
        }

        sizePanel.close();
        tabs.setActive(id);
        camGoal = goalFor(apartment.getActiveRoom());
        recompute();
    }
});

if (apartment.getRooms().length < 2) tabs.hide();
else tabs.setActive(apartment.getActiveRoom().id);
camGoal = goalFor(apartment.getActiveRoom());

// --- Бриф клиента (персонализация: тон-шаблоны + wishes) ---
const persona = pickClientPersona(clientId, new Rng(clientId + '·persona'));
createClientBrief({
    clientName: persona.clientName,
    tier: clientTier(levelId),
    styleLabel: app.styleLabel(task.styleId),
    toneKey: persona.toneKey,
    wishes: task.wishes
});

// --- Кнопка оценки ---
const evalButton = createEvaluateButton({
    onEvaluate: () => {
        if (app.items.getAllRaw().length === 0) {
            showEmptyHint();
            return;
        }
        evalButton.setEnabled(false);

        const result = evaluateNow(dashboard.getCurrentStyle());
        showFeedbackPanel(result, {
            onRetry: () => evalButton.setEnabled(true),
            onContinue: () => {
                sizePanel.close();
                manager.clear();
                evalButton.setEnabled(true);
            }
        });
    }
});

function showEmptyHint() {
    const existing = document.getElementById('eval-empty-hint');
    if (existing) existing.remove();
    const hint = document.createElement('div');
    hint.id = 'eval-empty-hint';
    hint.textContent = 'Добавьте хотя бы один предмет из библиотеки, прежде чем оценивать дизайн.';
    Object.assign(hint.style, {
        position: 'fixed', bottom: '90px', right: '20px', zIndex: '600',
        padding: '10px 14px', maxWidth: '280px', background: 'rgba(30, 38, 48, 0.95)',
        color: '#e0e8f0', fontSize: '13px', borderRadius: '10px',
        borderLeft: '3px solid #50b48c', boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui, sans-serif'
    });
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 3200);
}

// =============================================================================
// 5. Render-цикл
// =============================================================================
let last = performance.now();
let elapsed = 0;

function render() {
    const now = performance.now();
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.max(0, Math.min(0.05, dt));
    elapsed += dt;

    animation.update(dt);
    apartment.update(dt);
    props.update(dt, elapsed);

    if (camGoal) {
        camera.position.lerp(camGoal, 1 - Math.exp(-3.5 * dt));
        if (camera.position.distanceTo(camGoal) < 0.05) camGoal = null;
    }
    orbit.update();

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(render);

// =============================================================================
// 6. Рекомпозиция
// =============================================================================
function recompute() {
    dashboard.update();
    if (apartment.getRooms().length > 1) {
        tabs.setScores(evaluateNow(dashboard.getCurrentStyle()).perRoom);
    }
}

recompute();
dashboard.hideLoader();

// =============================================================================
// 7. Resize
// =============================================================================
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});