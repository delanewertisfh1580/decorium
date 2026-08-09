// =============================================================================
// styles.js — Определения стилей интерьера в виде набора линейных ограничений.
// Каждое ограничение: { feature, operator, threshold, group, weight }.
//   value = V_комнаты[feature]
//   Ограничение выполнено, если:
//     '>=': value >= threshold
//     '<=': value <= threshold
//     '==': |value - threshold| <= EPSILON
//   Штраф = weight * величина нарушения (см. domain/services/StyleScorer.js).
// =============================================================================

export const STYLES = {
  // -------------------------------------------------------------------------
  scandinavian: {
    id: 'scandinavian',
    name: 'Скандинавский',
    icon: '🪵',
    description: 'Светлые тона, натуральное дерево, простые и функциональные формы.',
    constraints: [
      { feature: 'wood_ratio',  operator: '>=', threshold: 0.60, group: 'Материалы', weight: 1.0 },
      { feature: 'lightness',   operator: '>=', threshold: 0.60, group: 'Цвет',      weight: 1.0 },
      { feature: 'simplicity',  operator: '>=', threshold: 0.60, group: 'Геометрия', weight: 1.0 },
      { feature: 'warmth',      operator: '>=', threshold: 0.50, group: 'Цвет',      weight: 0.8 },
      { feature: 'metal_ratio', operator: '<=', threshold: 0.20, group: 'Материалы', weight: 0.6 },
      { feature: 'glass_ratio', operator: '<=', threshold: 0.25, group: 'Материалы', weight: 0.4 },
    ],
  },

  // -------------------------------------------------------------------------
  loft: {
    id: 'loft',
    name: 'Лофт',
    icon: '🏭',
    description: 'Металл, кирпич, индустриальный характер, грубые фактуры.',
    constraints: [
      { feature: 'metal_ratio', operator: '>=', threshold: 0.50, group: 'Материалы', weight: 1.0 },
      { feature: 'angularity',  operator: '>=', threshold: 0.55, group: 'Геометрия', weight: 1.0 },
      { feature: 'warmth',      operator: '>=', threshold: 0.40, group: 'Цвет',      weight: 0.7 },
      { feature: 'lightness',   operator: '<=', threshold: 0.45, group: 'Цвет',      weight: 0.8 },
      { feature: 'simplicity',  operator: '<=', threshold: 0.45, group: 'Геометрия', weight: 0.8 },
      { feature: 'textile_ratio', operator: '<=', threshold: 0.30, group: 'Материалы', weight: 0.4 },
    ],
  },

  // -------------------------------------------------------------------------
  modern: {
    id: 'modern',
    name: 'Модерн',
    icon: '🔷',
    description: 'Стекло, прямые линии, холодная палитра, минимализм.',
    constraints: [
      { feature: 'glass_ratio', operator: '>=', threshold: 0.40, group: 'Материалы', weight: 1.0 },
      { feature: 'simplicity',  operator: '>=', threshold: 0.70, group: 'Геометрия', weight: 1.0 },
      { feature: 'angularity',  operator: '>=', threshold: 0.60, group: 'Геометрия', weight: 0.8 },
      { feature: 'lightness',   operator: '>=', threshold: 0.45, group: 'Цвет',      weight: 0.6 },
      { feature: 'warmth',      operator: '<=', threshold: 0.40, group: 'Цвет',      weight: 0.9 },
      { feature: 'wood_ratio',  operator: '<=', threshold: 0.35, group: 'Материалы', weight: 0.5 },
    ],
  },
};

/**
 * Список всех стилей (для UI-селектора).
 * @returns {Array<{id:string, name:string, icon:string, description:string}>}
 */
export function getStyleList() {
  return Object.values(STYLES).map(({ id, name, icon, description }) => ({
    id, name, icon, description,
  }));
}

/**
 * Возвращает id стиля по умолчанию (первый уровень — скандинавский).
 */
export const DEFAULT_STYLE_ID = 'scandinavian';