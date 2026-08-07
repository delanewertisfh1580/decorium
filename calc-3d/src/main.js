// =============================================================================
// main.js — точка сборки приложения (Decorium MVP).
// Направление зависимостей: config ← domain ← (items, scene, controls, ui) ← main.
// v1.1: панель размеров предметов.
// v1.1.1: настройка полок стеллажа, исправлено пересечение предметов на полках.
// v2.0 (Decorium MVP): векторная оценка стиля и эргономики, лепестковая
//        диаграмма, обратная связь от «клиента», кнопка оценки.
// v2.0.1: ИСПРАВЛЕН render-цикл — добавлены покадровые animation.update(dt)
//        и virtualBox.update(dt); исправлена сигнатура setTarget(w, h, d).
// =============================================================================

import * as THREE from 'three';
import { MAX_BOX } from './config.js';
import { getItems, getTotalVolume, getItem, subscribe } from './domain/state.js';
import { computeRecommendation } from './domain/pricing.js';
import { initScene } from './scene/renderer.js';
import { createVirtualBox } from './scene/virtualBox.js';
import { createManager } from './items/manager.js';
import * as animation from './items/animation.js';
import { initControls } from './controls/drag.js';
import { initDashboard } from './ui/dashboard.js';
import { initLibrary } from './ui/library.js';
import { createSizePanel } from './ui/sizePanel.js';

// === Decorium MVP: интеграция новой логики оценки ===
import { runEvaluation } from './game/evaluator.js';
import { createEvaluateButton } from './ui/evaluateButton.js';
import { showFeedbackPanel, hideFeedbackPanel } from './ui/feedbackPanel.js';

// =============================================================================
// 1. Сцена и виртуальный бокс
// =============================================================================
const canvas = document.getElementById('scene');
const { renderer, scene, camera, orbit } = initScene(canvas);

const virtualBox = createVirtualBox(scene); // стартовый размер 3×3×3 (MAX_BOX)

// =============================================================================
// 2. Дашборд
// =============================================================================
const dashboard = initDashboard();

// =============================================================================
// 3. Менеджер предметов
// =============================================================================
const manager = createManager({ scene, virtualBox, animation, onChanged: recompute });

// =============================================================================
// 4. Панель размеров и полок (v1.1 / v1.1.1)
// =============================================================================
const sizePanel = createSizePanel({
  onResize: manager.resizeItem,
  onShelfLevels: manager.setShelfLevels,
  getItem
});

// =============================================================================
// 5. Управление: перетаскивание, выбор кликом, удаление двойным кликом
// =============================================================================
initControls({
  camera,
  domElement: canvas,
  orbit,
  manager,
  onSelect: (id) => {
    // null — клик в пустоту или предмет удалён: панель закрываем
    if (id === null) {
      sizePanel.close();
      hideFeedbackPanel(); // Decorium MVP: закрываем и панель оценки
      return;
    }
    const record = getItem(id);
    if (record) sizePanel.open(id, record);
  }
});

// =============================================================================
// 6. Библиотека предметов
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
// 7. Decorium MVP: кнопка оценки дизайна и запуск scoring-пайплайна
// =============================================================================
const evalButton = createEvaluateButton({
  onEvaluate: (styleId) => {
    const items = getItems();
    if (items.length === 0) {
      showEmptyHint();
      return;
    }

    evalButton.setEnabled(false);

    const result = runEvaluation(
      {
        getItems,
        getMeshes: manager.getMeshes,
        virtualBox,
      },
      styleId
    );

    showFeedbackPanel(result, {
      onRetry: () => {
        evalButton.setEnabled(true);
      },
      onContinue: () => {
        sizePanel.close();
        manager.clear();
        evalButton.setEnabled(true);
      },
    });
  },
});

// Плашка-подсказка для пустой сцены (вместо alert)
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
    fontFamily: 'system-ui, sans-serif',
    animation: 'evalHintFade 3s forwards',
  });
  document.body.appendChild(hint);
  setTimeout(() => hint.remove(), 3200);
}

const hintStyle = document.createElement('style');
hintStyle.textContent = `
  @keyframes evalHintFade {
    0%   { opacity: 0; transform: translateY(8px); }
    10%  { opacity: 1; transform: translateY(0); }
    80%  { opacity: 1; }
    100% { opacity: 0; transform: translateY(-4px); }
  }
`;
document.head.appendChild(hintStyle);

// =============================================================================
// 8. Render-цикл — ИСПРАВЛЕНО (v2.0.1)
// Покадровые обновления обязательны:
//   animation.update(dt)  — рост спавна (scale 0.01→1) и падение предметов;
//   virtualBox.update(dt) — плавная подгонка бокса к целевому размеру.
// Без них сцена «умирает»: предметы невидимы, бокс не меняется.
// =============================================================================
let lastTime = performance.now();

function render(now) {
  const dt = Math.max(0, Math.min(0.05, (now - lastTime) / 1000));
  lastTime = now;

  animation.update(dt);
  virtualBox.update(dt);
  orbit.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(render);

// =============================================================================
// 9. Рекомпозиция дашборда при изменении состава
// ИСПРАВЛЕНО (v2.0.1): setTarget принимает (w, h, d) числами, а не объект.
// =============================================================================
function recompute() {
  const items = getItems();
  const totalVolume = getTotalVolume();
  const rec = computeRecommendation(items, totalVolume);

  if (rec.type === 'box') {
    virtualBox.setTarget(rec.box.w, rec.box.h, rec.box.d);
  } else {
    // 'empty' и 'xl' — показываем максимальный бокс 3×3×3
    virtualBox.setTarget(MAX_BOX.w, MAX_BOX.h, MAX_BOX.d);
  }

  dashboard.update(items, totalVolume, rec);
}

// Первичный вызов — до первого кадра
recompute();
dashboard.hideLoader();

// =============================================================================
// 10. Resize
// =============================================================================
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});