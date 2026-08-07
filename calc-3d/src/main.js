// =============================================================================
// main.js — точка сборки Decorium, Шаг Г («декларативные уровни +
// персонализация»). Пайплайн: seed → генератор → JSON → схема → сцена.
// Персональный стиль (вариация ±0.1) и wishes клиента подключены к оценке.
// Ядро (manager/stacking/state/drag) и domain/scoring.js не переписаны.
// =============================================================================

import * as THREE from 'three';
import { getItems, getItem, updateItem } from './domain/state.js';
import { STYLES } from './domain/styles.js';
import { initScene } from './scene/renderer.js';
import { createManager } from './items/manager.js';
import * as animation from './items/animation.js';
import { initControls } from './controls/drag.js';
import { initDashboard } from './ui/dashboard.js';
import { initLibrary } from './ui/library.js';
import { createSizePanel } from './ui/sizePanel.js';
import { runEvaluation } from './game/evaluator.js';
import { createEvaluateButton } from './ui/evaluateButton.js';
import { showFeedbackPanel, hideFeedbackPanel } from './ui/feedbackPanel.js';

// Decorium
import { makeLevel } from './level/levelLoader.js';
import { registerVariedStyle } from './level/variation.js';
import { pickClientPersona, clientTier } from './level/tone.js';
import { createApartment } from './level/apartment.js';
import { createProps } from './items/animated.js';
import { createRoomTabs } from './ui/roomTabs.js';
import { createClientBrief } from './ui/clientBrief.js';
import { Rng } from './level/rng.js';

// =============================================================================
// 1. Сцена
// =============================================================================
const canvas = document.getElementById('scene');
const { renderer, scene, camera, orbit } = initScene(canvas);
orbit.target.set(0, 1, 0);

// =============================================================================
// 2. Декларативный уровень: ?client=...&level=... → JSON → схема → TaskContract
// =============================================================================
const params = new URLSearchParams(location.search);
const levelId = Math.max(1, parseInt(params.get('level') || '8', 10) || 8);
const clientId = params.get('client') || 'user1';

const { task } = makeLevel({ clientId, levelId });

const apartment = createApartment(scene, task);

const props = createProps(task.anims, apartment.getBounds(), new Rng(task.seed + '·props'));
scene.add(props.group);

// =============================================================================
// 3. Дашборд (инициализируется ДО регистрации персонального стиля —
//    селект стилей остаётся чистым)
// =============================================================================
const dashboard = initDashboard({
    getItems,
    getMeshes: () => manager.getMeshes(),
    virtualBox: apartment
});

// Персональные пороги клиента: b_i += rand[-0.1, +0.1] (GDD)
const variedStyleId = registerVariedStyle(task.styleId, new Rng(task.seed + '·var'));

// =============================================================================
// 4. Менеджер
// =============================================================================
const manager = createManager({
    scene,
    virtualBox: apartment,
    animation,
    onChanged: recompute
});

// =============================================================================
// 5. Панель размеров
// =============================================================================
const sizePanel = createSizePanel({
    onResize: manager.resizeItem,
    onShelfLevels: manager.setShelfLevels,
    getItem
});

// =============================================================================
// 6. Управление
// =============================================================================
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
        const record = getItem(id);
        if (record) sizePanel.open(id, record);
    }
});

// =============================================================================
// 7. Библиотека
// =============================================================================
initLibrary({
    onAdd: manager.addItem,
    onClear: () => {
        sizePanel.close();
        hideFeedbackPanel();
        manager.clear();
    }
});

// =============================================================================
// 8. Табы комнат
// =============================================================================
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
            for (const it of getItems()) {
                const mesh = manager.getMeshById(it.id);
                if (mesh) {
                    mesh.position.x += dx;
                    mesh.position.z += dz;
                }
                updateItem(it.id, { x: it.x + dx, z: it.z + dz });
            }
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

// =============================================================================
// 9. Бриф клиента (персонализация: тон-шаблоны + wishes)
// =============================================================================
const persona = pickClientPersona(clientId, new Rng(clientId + '·persona'));
createClientBrief({
    clientName: persona.clientName,
    tier: clientTier(levelId),
    styleLabel: (STYLES[task.styleId] && STYLES[task.styleId].label) || task.styleId,
    toneKey: persona.toneKey,
    wishes: task.wishes
});

// =============================================================================
// 10. Кнопка оценки (стиль — персональный, wishes — в scoring и фидбек)
// =============================================================================
const evalButton = createEvaluateButton({
    onEvaluate: () => {
        const items = getItems();
        if (items.length === 0) {
            showEmptyHint();
            return;
        }
        evalButton.setEnabled(false);

        const result = runEvaluation(
            { getItems, getMeshes: manager.getMeshes, virtualBox: apartment },
            variedStyleId,
            task.wishes
        );

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
// 11. Render-цикл
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
// 12. Рекомпозиция: дашборд (базовый стиль) + табы (per-room, персональный стиль)
// =============================================================================
function recompute() {
    dashboard.update();
    if (apartment.getRooms().length > 1) {
        const res = runEvaluation(
            { getItems, getMeshes: manager.getMeshes, virtualBox: apartment },
            variedStyleId,
            task.wishes
        );
        tabs.setScores(res.perRoom);
    }
}

recompute();
dashboard.hideLoader();

// =============================================================================
// 13. Resize
// =============================================================================
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});