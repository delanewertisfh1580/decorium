// =============================================================================
// evaluateButton.js — Плавающая кнопка запуска оценки Decorium.
// Располагается в правом нижнем углу сцены. Содержит:
//   - Кнопку "Оценить дизайн ✓"
//   - Мини-селектор стиля (Скандинавский / Лофт / Модерн)
// =============================================================================

import { getStyleList } from '../domain/styles.js';
import './evaluateButton.css';

/**
 * Создаёт и монтирует кнопку оценки. Возвращает контроллер.
 * @param {object} callbacks
 * @param {Function} callbacks.onEvaluate - (styleId) => void, вызывается по клику
 * @returns {{ setEnabled(bool), getCurrentStyle(), remove() }}
 */
export function createEvaluateButton(callbacks = {}) {
  const styles = getStyleList();
  let currentStyleId = styles[0]?.id || 'scandinavian';

  const wrap = document.createElement('div');
  wrap.className = 'eval-wrap';

  // --- Селектор стиля ---
  const select = document.createElement('select');
  select.className = 'eval-select';
  for (const s of styles) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.icon} ${s.name}`;
    select.appendChild(opt);
  }
  select.addEventListener('change', (e) => {
    currentStyleId = e.target.value;
  });

  // --- Кнопка запуска ---
  const btn = document.createElement('button');
  btn.className = 'eval-btn';
  btn.textContent = '✓ Оценить дизайн';
  btn.addEventListener('click', () => {
    if (callbacks.onEvaluate) callbacks.onEvaluate(currentStyleId);
  });

  wrap.appendChild(select);
  wrap.appendChild(btn);
  document.body.appendChild(wrap);

  return {
    getCurrentStyle: () => currentStyleId,
    setEnabled: (enabled) => {
      btn.disabled = !enabled;
      select.disabled = !enabled;
      wrap.classList.toggle('eval-disabled', !enabled);
    },
    remove: () => wrap.remove(),
  };
}