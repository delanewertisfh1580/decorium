// =============================================================================
// features.js — Словарь признаков векторной модели Decorium.
//
// Каждый предмет описывается вектором из FEATURE_COUNT признаков,
// нормализованных в диапазон [0..1]. Порядок в массиве FEATURES определяет
// индекс признака в векторе. Это ядро системы оценки — от него зависят
// стили (styles.js) и расчёт штрафов (scoring.js).
// =============================================================================

export const FEATURES = [
  // --- Материалы (доля каждого материала в предмете) ---
  { key: 'wood_ratio',    name: 'Доля дерева',     group: 'Материалы' },
  { key: 'metal_ratio',   name: 'Доля металла',    group: 'Материалы' },
  { key: 'glass_ratio',   name: 'Доля стекла',     group: 'Материалы' },
  { key: 'textile_ratio', name: 'Доля текстиля',   group: 'Материалы' },

  // --- Цвет ---
  { key: 'warmth',        name: 'Теплота палитры', group: 'Цвет' },
  { key: 'lightness',     name: 'Светлота',        group: 'Цвет' },

  // --- Геометрия ---
  { key: 'angularity',    name: 'Острые углы',     group: 'Геометрия' },
  { key: 'simplicity',    name: 'Простота формы',  group: 'Геометрия' },

  // --- Масштаб / экономика ---
  { key: 'scale',         name: 'Масштаб',         group: 'Структура' },
  { key: 'price',         name: 'Цена',            group: 'Структура' },
];

export const FEATURE_COUNT = FEATURES.length;

// Быстрый доступ: ключ признака -> его индекс в векторе
export const FEATURE_INDEX = Object.fromEntries(
  FEATURES.map((f, i) => [f.key, i])
);

// Список ключей (для отладки и построения векторов)
export const FEATURE_KEYS = FEATURES.map((f) => f.key);

// Уникальные группы признаков (для лепестковой диаграммы)
export const FEATURE_GROUPS = [...new Set(FEATURES.map((f) => f.group))];

// Нулевой вектор
export function zeroVector() {
  return new Array(FEATURE_COUNT).fill(0);
}

/**
 * Валидация вектора признаков.
 * @param {number[]} vec
 * @returns {boolean}
 */
export function isValidVector(vec) {
  if (!Array.isArray(vec) || vec.length !== FEATURE_COUNT) return false;
  return vec.every((v) => typeof v === 'number' && !Number.isNaN(v) && v >= 0 && v <= 1);
}

/**
 * Сформировать вектор из объекта { ключ_признака: значение }.
 * Удобно при описании предметов: не нужно помнить порядок в массиве.
 * @param {Object<string, number>} obj
 * @returns {number[]}
 */
export function vectorFromObject(obj) {
  const vec = zeroVector();
  for (const [key, value] of Object.entries(obj)) {
    const idx = FEATURE_INDEX[key];
    if (idx === undefined) {
      console.warn(`[features] Неизвестный признак: "${key}"`);
      continue;
    }
    vec[idx] = Math.min(1, Math.max(0, value)); // климп в [0..1]
  }
  return vec;
}