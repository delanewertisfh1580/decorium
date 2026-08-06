// =============================================================================
// styles.js — Определения стилей интерьера для Decorium.
//
// Каждый стиль задаётся набором ЛИНЕЙНЫХ ОГРАНИЧЕНИЙ над вектором комнаты
// (см. GDD: a_i · V_room >=< b_i). Каждое ограничение имеет:
//   feature   — ключ признака из features.js
//   operator  — '>=', '<=', '=='
//   threshold — порог b_i в диапазоне [0..1]
//   group     — группа для лепестковой диаграммы
//   weight    — вес штрафа (важность ограничения)
// =============================================================================

export const STYLES = {
  // ---------------------------------------------------------------------------
  // СКАНДИНАВСКИЙ: светлые тона, натуральное дерево, простые формы, минимум металла
  // ---------------------------------------------------------------------------
  scandinavian: {
    id: 'scandinavian',
    name: 'Скандинавский',
    emoji: '🌿',
    description: 'Светлые тона, натуральное дерево, простые и уютные формы.',
    constraints: [
      { feature: 'wood_ratio',  operator: '>=', threshold: 0.6,  group: 'Материалы', weight: 1.0 },
      { feature: 'lightness',   operator: '>=', threshold: 0.6,  group: 'Цвет',      weight: 1.0 },
      { feature: 'warmth',      operator: '>=', threshold: 0.5,  group: 'Цвет',      weight: 0.8 },
      { feature: 'simplicity',  operator: '>=', threshold: 0.6,  group: 'Геометрия', weight: 1.0 },
      { feature: 'metal_ratio', operator: '<=', threshold: 0.2,  group: 'Материалы', weight: 0.6 },
    ],
  },

  // ---------------------------------------------------------------------------
  // ЛОФТ: металл, индустриальные острые углы, приглушённые тона, грубые фактуры
  // ---------------------------------------------------------------------------
  loft: {
    id: 'loft',
    name: 'Лофт',
    emoji: '🏭',
    description: 'Металл, индустриальный характер, приглушённые тона.',
    constraints: [
      { feature: 'metal_ratio', operator: '>=', threshold: 0.5,  group: 'Материалы', weight: 1.0 },
      { feature: 'angularity',  operator: '>=', threshold: 0.5,  group: 'Геометрия', weight: 0.8 },
      { feature: 'simplicity',  operator: '<=', threshold: 0.45, group: 'Геометрия', weight: 0.7 },
      { feature: 'lightness',   operator: '<=', threshold: 0.5,  group: 'Цвет',      weight: 0.6 },
      { feature: 'glass_ratio', operator: '<=', threshold: 0.3,  group: 'Материалы', weight: 0.5 },
    ],
  },

  // ---------------------------------------------------------------------------
  // МОДЕРН: стекло, прямые линии, холодная и чистая палитра
  // ---------------------------------------------------------------------------
  modern: {
    id: 'modern',
    name: 'Модерн',
    emoji: '✨',
    description: 'Стекло, прямые линии, холодная и минималистичная палитра.',
    constraints: [
      { feature: 'glass_ratio', operator: '>=', threshold: 0.4,  group: 'Материалы', weight: 1.0 },
      { feature: 'simplicity',  operator: '>=', threshold: 0.7,  group: 'Геометрия', weight: 1.0 },
      { feature: 'angularity',  operator: '>=', threshold: 0.6,  group: 'Геометрия', weight: 0.7 },
      { feature: 'warmth',      operator: '<=', threshold: 0.4,  group: 'Цвет',      weight: 0.6 },
      { feature: 'lightness',   operator: '>=', threshold: 0.4,  group: 'Цвет',      weight: 0.5 },
    ],
  },
};

// Список всех стилей (для UI-селектора)
export const STYLE_LIST = Object.values(STYLES);

/**
 * Получить стиль по идентификатору.
 * @param {string} styleId
 * @returns {Object|null}
 */
export function getStyle(styleId) {
  return STYLES[styleId] ?? null;
}

/**
 * Дефолтный стиль для MVP.
 */
export const DEFAULT_STYLE_ID = 'scandinavian';