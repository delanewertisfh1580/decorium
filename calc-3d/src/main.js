// =============================================================================
// main.js — точка сборки приложения (Decorium MVP).
// Направление зависимостей: config ← domain ← (items, scene, controls, ui) ← main.
// v1.1: панель размеров предметов.
// v1.1.1: настройка полок стеллажа, исправлено пересечение предметов.
// v2.0 (Decorium MVP): интегрирована векторная оценка стиля и эргономики,
//        лепестковая диаграмма, обратная связь от «клиента», кнопка оценки.
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
// 2. Дашборд (метрики Self-Storage — оставлен без изменений)
// =============================================================================
const dashboard = initDashboard();

// =============================================================================
// 3. Менеджер предметов
// scene передаётся в deps — менеджер добавляет и удаляет меши
// =============================================================================
const manager = createManager({ scene, virtualBox, animation, onChanged: recompute });

// =============================================================================
// 4. Панель размеров и полок (v1.1 / v1.1.1)
// Валидацию и применение делает менеджер; getItem нужен панели, чтобы
// перечитывать применённые значения после ресайза (полки масштабируются).
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
      hideFeedbackPanel(); // Decorium MVP: закрываем и панель оценки при клике в пустоту
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
    sizePanel.close(); // панель выбранного предмета закрываем вместе с очисткой
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
      // Мягкое предупреждение вместо alert — чтобы не выбивать из атмосферы
      showEmptyHint();
      return;
    }

    // Блокируем кнопку, чтобы не было повторных кликов во время расчёта
    evalButton.setEnabled(false);

    // Запускаем полную оценку: стиль + эргономика + фидбек
    const result = runEvaluation(
      {
        getItems,
        getMeshes: manager.getMeshes,
        virtualBox,
      },
      styleId
    );

    // Показываем панель результатов с лепестковой диаграммой и комментариями
    showFeedbackPanel(result, {
      onRetry: () => {
        // Игрок остаётся в сцене и может доработать расстановку
        evalButton.setEnabled(true);
      },
      onContinue: () => {
        // Сброс уровня: очищаем сцену и разблокируем кнопку для нового дизайна
        sizePanel.close();
        manager.clear();
        evalButton.setEnabled(true);
      },
    });
  },
});

// Вспомогательная плашка-подсказка для пустой сцены (вместо alert)
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

// Инжектим keyframes для плавного появления и затухания подсказки
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
// 8. Render-цикл (без изменений)
// =============================================================================
function render() {
  orbit.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(render);

// =============================================================================
// 9. Рекомпозиция дашборда при изменении состава (без изменений)
// =============================================================================
function recompute() {
  const items = getItems();
  const totalVolume = getTotalVolume();
  const rec = computeRecommendation(items, totalVolume);
  virtualBox.setTarget(rec);
  dashboard.update(items, totalVolume, rec);
}

// Первичный вызов — до первого кадра (чтобы бокс 3×3×3 сразу появился)
recompute();
dashboard.hideLoader();

// =============================================================================
// 10. Resize (без изменений)
// =============================================================================
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});