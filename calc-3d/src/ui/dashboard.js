// =============================================================================
// ui/dashboard.js — дашборд метрик качества дизайна (Decorium MVP).
// В отличие от старой версии (расчёт стоимости Self-Storage), показывает:
//   - звёзды (1-5) и итоговый балл /100;
//   - баллы за стиль и эргономику;
//   - суб-оценки по группам (Цвет, Материалы, Геометрия, Структура);
//   - число нарушений и топ-комментарий клиента.
// Обновляется ТОЛЬКО по изменению состава — не в render-цикле.
// Модуль не импортирует three.
// =============================================================================

import { runEvaluation } from '../game/evaluator.js';
import { getStyleList, DEFAULT_STYLE_ID } from '../domain/styles.js';
import { generateFeedback } from '../domain/feedback.js';
import './dashboard.css';

export function initDashboard(deps) {
  // deps: { getItems, getMeshes, virtualBox } — передаются из main.js
  const el = {
    styleSelect: document.getElementById('q-style-select'),
    stars: document.getElementById('q-stars'),
    total: document.getElementById('q-total'),
    styleVal: document.getElementById('q-style-val'),
    styleBar: document.getElementById('q-style-bar'),
    ergoVal: document.getElementById('q-ergo-val'),
    ergoBar: document.getElementById('q-ergo-bar'),
    gColor: document.getElementById('q-g-color'),
    gMaterials: document.getElementById('q-g-materials'),
    gGeometry: document.getElementById('q-g-geometry'),
    gStructure: document.getElementById('q-g-structure'),
    violCount: document.getElementById('q-viol-count'),
    violText: document.getElementById('q-viol-text'),
    count: document.getElementById('m-count'),
    loader: document.getElementById('loader'),
    hint: document.getElementById('hint')
  };

  let currentStyleId = DEFAULT_STYLE_ID;
  let hintDimmed = false;

  // --- Селектор стиля клиента ---
  for (const s of getStyleList()) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.icon} ${s.name}`;
    el.styleSelect.appendChild(opt);
  }
  el.styleSelect.addEventListener('change', (e) => {
    currentStyleId = e.target.value;
    refresh();
  });

  // --- Мобильное раскрытие дашборда по тапу (как в старой версии) ---
  const root = document.querySelector('.dashboard');
  root.addEventListener('click', (event) => {
    if (!window.matchMedia('(max-width: 860px)').matches) return;
    if (event.target.closest('button, a, select')) return;
    root.classList.toggle('open');
  });

  // --- Хелперы отрисовки ---
  function setBar(barEl, valEl, value) {
    const pct = Math.round((value || 0) * 100);
    valEl.textContent = `${pct}%`;
    barEl.style.width = `${pct}%`;
    // Низкий балл подсвечиваем «тревожным» цветом (класс hot из styles.css)
    barEl.classList.toggle('hot', pct < 40);
  }

  function renderEmpty() {
    el.count.textContent = '0';
    el.stars.textContent = '☆☆☆☆☆';
    el.stars.className = 'q-stars';
    el.total.textContent = '— / 100';
    setBar(el.styleBar, el.styleVal, 0);
    setBar(el.ergoBar, el.ergoVal, 0);
    el.gColor.textContent = '—';
    el.gMaterials.textContent = '—';
    el.gGeometry.textContent = '—';
    el.gStructure.textContent = '—';
    el.violCount.textContent = '0';
    el.violText.textContent = 'Добавьте предметы, чтобы увидеть оценку.';
    el.violText.className = 'q-viol-text';
  }

  function render(result) {
    el.count.textContent = String(result.itemCount);

    if (result.empty) {
      renderEmpty();
      return;
    }

    // Звёзды и итог
    el.stars.textContent = '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars);
    el.stars.className =
      'q-stars' +
      (result.stars >= 4 ? ' q-stars--good' : result.stars <= 2 ? ' q-stars--bad' : '');
    el.total.textContent = `${Math.round(result.totalScore * 100)} / 100`;

    // Стиль / эргономика
    setBar(el.styleBar, el.styleVal, result.styleScore);
    setBar(el.ergoBar, el.ergoVal, result.ergonomicsScore);

    // Суб-оценки
    const g = result.groupScores || {};
    el.gColor.textContent = `${Math.round((g['Цвет'] ?? 0) * 100)}%`;
    el.gMaterials.textContent = `${Math.round((g['Материалы'] ?? 0) * 100)}%`;
    el.gGeometry.textContent = `${Math.round((g['Геометрия'] ?? 0) * 100)}%`;
    el.gStructure.textContent = `${Math.round((g['Структура'] ?? 0) * 100)}%`;

    // Нарушения
    const problems = result.violations.length;
    el.violCount.textContent = String(problems);
    if (problems === 0) {
      el.violText.textContent = 'Нет нарушений — отличная работа!';
      el.violText.className = 'q-viol-text q-viol-text--ok';
    } else {
      const feedback = generateFeedback(result);
      const top = feedback.find(f => f.severity > 0);
      el.violText.textContent = top
        ? `«${top.text}»`
        : 'Есть нарушения — нажмите «Оценить дизайн» для деталей.';
      el.violText.className = 'q-viol-text';
    }
  }

  // --- Пересчёт оценки (вызывается по изменению состава и смене стиля) ---
  function refresh() {
    const result = runEvaluation(deps, currentStyleId);
    render(result);
    return result;
  }

  // Скрыть лоадер (после первого кадра) и запланировать затухание подсказки
  function hideLoader() {
    el.loader.classList.add('hide');
    if (!hintDimmed) {
      hintDimmed = true;
      setTimeout(() => el.hint.classList.add('dim'), 9000);
    }
  }

  // Первичная отрисовка пустого состояния
  renderEmpty();

  return {
    update: () => refresh(),          // совместимый API для recompute в main.js
    hideLoader,
    getCurrentStyle: () => currentStyleId
  };
}