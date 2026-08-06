// =============================================================================
// feedbackPanel.js — Экран результатов уровня.
// Отображает: итоговые звёзды (1-5), лепестковую диаграмму суб-оценок
// (Цвет, Материалы, Геометрия, Структура), комментарии клиента, кнопки.
// Реализован как DOM-оверлей поверх 3D-канваса.
// =============================================================================

import { generateFeedback, getSummary } from '../domain/feedback.js';
import './feedbackPanel.css';

const GROUP_ORDER = ['Цвет', 'Материалы', 'Геометрия', 'Структура'];
const GROUP_ICONS = { 'Цвет': '🎨', 'Материалы': '🪵', 'Геометрия': '📐', 'Структура': '🏗️' };

/**
 * Создаёт и показывает панель результатов.
 * @param {object} result - результат evaluateRoom()
 * @param {object} callbacks - { onRetry, onContinue }
 */
export function showFeedbackPanel(result, callbacks = {}) {
  // Удаляем предыдущую панель, если есть
  hideFeedbackPanel();

  const overlay = document.createElement('div');
  overlay.id = 'feedback-panel';
  overlay.className = 'fp-overlay';

  // --- Заголовок ---
  const header = document.createElement('div');
  header.className = 'fp-header';
  header.textContent = 'Результат дизайна';
  overlay.appendChild(header);

  // --- Звёзды ---
  const starsEl = document.createElement('div');
  starsEl.className = 'fp-stars';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = i <= result.stars ? 'fp-star fp-star--filled' : 'fp-star';
    star.textContent = '★';
    starsEl.appendChild(star);
  }
  overlay.appendChild(starsEl);

  // --- Итоговый балл ---
  const scoreEl = document.createElement('div');
  scoreEl.className = 'fp-score';
  scoreEl.textContent = `${Math.round(result.totalScore * 100)} / 100`;
  overlay.appendChild(scoreEl);

  // --- Лепестковая диаграмма ---
  const chartWrap = document.createElement('div');
  chartWrap.className = 'fp-chart-wrap';
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 280;
  canvas.className = 'fp-chart';
  chartWrap.appendChild(canvas);
  overlay.appendChild(chartWrap);
  drawRadarChart(canvas, result.groupScores);

  // --- Подписи суб-оценок ---
  const labelsEl = document.createElement('div');
  labelsEl.className = 'fp-labels';
  for (const g of GROUP_ORDER) {
    const val = result.groupScores[g] ?? 1;
    const item = document.createElement('div');
    item.className = 'fp-label';
    item.innerHTML = `${GROUP_ICONS[g] || ''} ${g}: <b>${Math.round(val * 100)}%</b>`;
    labelsEl.appendChild(item);
  }
  overlay.appendChild(labelsEl);

  // --- Комментарий-заголовок ---
  const summaryEl = document.createElement('div');
  summaryEl.className = 'fp-summary';
  summaryEl.textContent = getSummary(result.stars);
  overlay.appendChild(summaryEl);

  // --- Список комментариев ---
  const feedback = generateFeedback(result);
  if (feedback.length > 0) {
    const listEl = document.createElement('div');
    listEl.className = 'fp-feedback-list';
    for (const f of feedback.slice(0, 6)) {
      const item = document.createElement('div');
      const sevClass = f.severity === 0 ? 'fp-feedback--positive'
        : f.severity >= 3 ? 'fp-feedback--critical'
        : f.severity === 2 ? 'fp-feedback--warning'
        : 'fp-feedback--info';
      item.className = `fp-feedback ${sevClass}`;
      item.textContent = `«${f.text}»`;
      listEl.appendChild(item);
    }
    overlay.appendChild(listEl);
  }

  // --- Кнопки ---
  const btnRow = document.createElement('div');
  btnRow.className = 'fp-buttons';

  const retryBtn = document.createElement('button');
  retryBtn.className = 'fp-btn fp-btn--retry';
  retryBtn.textContent = '↻ Повторить';
  retryBtn.addEventListener('click', () => {
    hideFeedbackPanel();
    if (callbacks.onRetry) callbacks.onRetry();
  });

  const continueBtn = document.createElement('button');
  continueBtn.className = 'fp-btn fp-btn--continue';
  continueBtn.textContent = 'Продолжить ✓';
  continueBtn.addEventListener('click', () => {
    hideFeedbackPanel();
    if (callbacks.onContinue) callbacks.onContinue();
  });

  btnRow.appendChild(retryBtn);
  btnRow.appendChild(continueBtn);
  overlay.appendChild(btnRow);

  document.body.appendChild(overlay);
}

/**
 * Скрывает и удаляет панель результатов.
 */
export function hideFeedbackPanel() {
  const existing = document.getElementById('feedback-panel');
  if (existing) existing.remove();
}

/**
 * Рисует лепестковую диаграмму (radar chart) на canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} groupScores - { 'Цвет': 0.8, 'Материалы': 0.9, ... }
 */
function drawRadarChart(canvas, groupScores) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(cx, cy) - 30;
  const n = GROUP_ORDER.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2; // начинаем сверху

  ctx.clearRect(0, 0, w, h);

  // --- Фоновая сетка (концентрические многоугольники) ---
  const levels = 4;
  for (let lvl = levels; lvl >= 1; lvl--) {
    const r = (maxR * lvl) / levels;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = lvl === levels ? '#5a6b7a' : '#3a4a5a';
    ctx.lineWidth = lvl === levels ? 1.5 : 0.7;
    ctx.stroke();
  }

  // --- Оси и подписи ---
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#c0ccd8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const x2 = cx + maxR * Math.cos(angle);
    const y2 = cy + maxR * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#3a4a5a';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Подпись за пределами диаграммы
    const lx = cx + (maxR + 18) * Math.cos(angle);
    const ly = cy + (maxR + 18) * Math.sin(angle);
    ctx.fillText(GROUP_ORDER[i], lx, ly);
  }

  // --- Многоугольник значений ---
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const idx = i % n;
    const val = groupScores[GROUP_ORDER[idx]] ?? 1;
    const r = maxR * Math.max(0.05, Math.min(1, val));
    const angle = startAngle + idx * angleStep;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(80, 180, 140, 0.35)';
  ctx.fill();
  ctx.strokeStyle = '#50b48c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // --- Точки на вершинах ---
  for (let i = 0; i < n; i++) {
    const val = groupScores[GROUP_ORDER[i]] ?? 1;
    const r = maxR * Math.max(0.05, Math.min(1, val));
    const angle = startAngle + i * angleStep;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#50b48c';
    ctx.fill();
  }
}