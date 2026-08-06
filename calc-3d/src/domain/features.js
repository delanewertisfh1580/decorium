// =============================================================================
// features.js — Словарь признаков векторной модели Decorium.
// Каждый предмет описывается вектором из FEATURE_COUNT чисел в диапазоне [0..1].
// Порядок элементов в массиве FEATURES определяет индекс признака в векторе.
// Все значения нормализованы (минимакс), чтобы ни один признак не доминировал.
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

  // --- Структура / масштаб ---
  { key: 'scale',         name: 'Масштаб',         group: 'Структура' },
  { key: 'price',         name: 'Цена',            group: 'Структура' },
];

export const FEATURE_COUNT = FEATURES.length;

// Быстрый доступ к индексу признака по ключу: FEATURE_INDEX['wood_ratio'] === 0
export const FEATURE_INDEX = Object.fromEntries(
  FEATURES.map((f, i) => [f.key, i])
);

// Список ключей (удобно для итераций)
export const FEATURE_KEYS = FEATURES.map(f => f.key);

// Уникальные группы признаков (для лепестковой диаграммы): Материалы, Цвет, Геометрия, Структура
export const FEATURE_GROUPS = [...new Set(FEATURES.map(f => f.group))];

// Имена признаков по индексу (для отладки/вывода)
export const FEATURE_NAMES = FEATURES.map(f => f.name);

/**
 * Возвращает нулевой вектор признаков.
 * @returns {number[]} массив из FEATURE_COUNT нулей
 */
export function zeroVector() {
  return new Array(FEATURE_COUNT).fill(0);
}

/**
 * Проверяет валидность вектора признаков.
 * @param {number[]} v - вектор признаков
 * @returns {boolean}
 */
export function isValidVector(v) {
  return Array.isArray(v) && v.length === FEATURE_COUNT &&
    v.every(x => typeof x === 'number' && Number.isFinite(x));
}

/**
 * Ограничивает значения вектора диапазоном [0..1] (защита от выхода за границы).
 * @param {number[]} v
 * @returns {number[]}
 */
export function clampVector(v) {
  return v.map(x => Math.min(1, Math.max(0, x)));
}