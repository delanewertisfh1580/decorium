// =============================================================================
// ui/evaluateButton.js — плавающая кнопка запуска оценки Decorium.
// v2.1: селектор стиля перенесён в дашборд; кнопка только запускает оценку.
// =============================================================================

import './evaluateButton.css';

/**
 * Создаёт и монтирует кнопку оценки. Возвращает контроллер.
 * @param {object} callbacks
 * @param {Function} callbacks.onEvaluate - () => void, вызывается по клику
 * @returns {{ setEnabled(bool), remove() }}
 */
export function createEvaluateButton(callbacks = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'eval-wrap';

  const btn = document.createElement('button');
  btn.className = 'eval-btn';
  btn.textContent = '✓ Оценить дизайн';
  btn.addEventListener('click', () => {
    if (callbacks.onEvaluate) callbacks.onEvaluate();
  });

  wrap.appendChild(btn);
  document.body.appendChild(wrap);

  return {
    setEnabled: (enabled) => {
      btn.disabled = !enabled;
      wrap.classList.toggle('eval-disabled', !enabled);
    },
    remove: () => wrap.remove(),
  };
}