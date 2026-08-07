// =============================================================================
// main.js — точка сборки Decorium, Шаг Б («живая сцена»).
// Бутстрап 1:1 по контрактам движка; virtualBox заменён на apartment;
// живые пропы (items/animated.js) подключены в render-цикл.
// =============================================================================

import { getItems, getItem } from './domain/state.js';
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
import { makeTask } from './level/task.js';
import { createApartment } from './level/apartment.js';
import { createProps } from './items/animated.js';
import { Rng } from './level/rng.js';

// =============================================================================
// 1. Сцена (родной канвас #scene)
// =============================================================================
const canvas = document.getElementById('scene');
const { renderer, scene, camera, orbit } = initScene(canvas);

// =============================================================================
// 2. Уровень: TaskContract → комната → живые пропы
// =============================================================================
const task = makeTask({ clientId: 'user1', levelId: 1 });
const apartment = createApartment(scene, task);

const props = createProps(task.anims, apartment.getBounds(), new Rng(task.seed + '·props'));
scene.add(props.group);

// =============================================================================
// 3. Дашборд качества
// =============================================================================
const dashboard = initDashboard({
    getItems,
    getMeshes: () => manager.getMeshes(),
    virtualBox: apartment
});

// =============================================================================
// 4. Менеджер предметов
// =============================================================================
const manager = createManager({
    scene,
    virtualBox: apartment,
    animation,
    onChanged: recompute
});

// =============================================================================
// 5. Панель размеров и полок
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
// 8. Кнопка оценки дизайна
// =============================================================================
const evalButton = createEvaluateButton({
    onEvaluate: () => {
        const items = getItems();
        if (items.length === 0) {
            showEmptyHint();
            return;
        }
        evalButton.setEnabled(false);

        const styleId = dashboard.getCurrentStyle();
        const result = runEvaluation(
            { getItems, getMeshes: manager.getMeshes, virtualBox: apartment },
            styleId
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
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        zIndex: '600',
        padding: '10px 14px',
        maxWidth: '280px',
        background: 'rgba(30, 38, 48, 0.95)',
        color: '#e0e8f0',
        fontSize: '13px',
        borderRadius: '10px',
        borderLeft: '3px solid #50b48c',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui, sans-serif'
    });
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 3200);
}

// =============================================================================
// 9. Render-цикл: animation + apartment + props + orbit
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
    orbit.update();

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(render);

// =============================================================================
// 10. Рекомпозиция дашборда
// =============================================================================
function recompute() {
    dashboard.update();
}

recompute();
dashboard.hideLoader();

// =============================================================================
// 11. Resize
// =============================================================================
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});