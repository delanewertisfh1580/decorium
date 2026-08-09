// =============================================================================
// itemCatalog.js — Каталог игровых предметов Decorium с векторами признаков.
// Каждый предмет содержит:
//   - features_vector: нормализованный вектор признаков (см. features.js)
//   - dimensions: габариты в метрах {x,y,z} для 3D-рендеринга
//   - color: цвет меша (hex)
//   - tags: стилевые/функциональные теги
// Также здесь находится универсальный адаптер getItemFeaturesVector(item),
// который умеет извлекать вектор как из игрового предмета, так и из
// произвольного предмета существующего движка (по features_vector / decor / типу).
// =============================================================================

import { FEATURE_COUNT, FEATURE_INDEX, isValidVector } from './features.js';

/**
 * Вспомогательная функция сборки вектора по объекту {ключ_признака: значение}.
 * Незаданные признаки = 0. Порядок соответствует features.js.
 */
function vec(values) {
  const v = new Array(FEATURE_COUNT).fill(0);
  for (const [key, val] of Object.entries(values)) {
    const idx = FEATURE_INDEX[key];
    if (idx !== undefined) v[idx] = val;
  }
  return v;
}

/**
 * Каталог игровых предметов. Покрывает три стиля: Скандинавский, Лофт, Модерн.
 * dimensions в метрах, согласованы с виртуальным боксом движка.
 */
export const ITEM_CATALOG = [
  // ------------------------- Скандинавский -------------------------------
  {
    id: 'sofa_scandi',
    name: 'Скандинавский диван',
    kind: 'sofa',
    styleTags: ['scandinavian'],
    dimensions: { x: 2.0, y: 0.85, z: 0.95 },
    color: 0xd9c8a9,
    price: 150,
    features_vector: vec({
      wood_ratio: 0.90, metal_ratio: 0.05, textile_ratio: 0.05,
      warmth: 0.80, lightness: 0.80,
      angularity: 0.30, simplicity: 0.90,
      scale: 0.70, price: 0.50,
    }),
  },
  {
    id: 'table_scandi',
    name: 'Деревянный стол',
    kind: 'table',
    styleTags: ['scandinavian'],
    dimensions: { x: 1.4, y: 0.75, z: 0.8 },
    color: 0xc4a373,
    price: 90,
    features_vector: vec({
      wood_ratio: 0.95, metal_ratio: 0.05,
      warmth: 0.75, lightness: 0.75,
      angularity: 0.50, simplicity: 0.85,
      scale: 0.55, price: 0.35,
    }),
  },
  {
    id: 'shelf_scandi',
    name: 'Светлый стеллаж',
    kind: 'shelf',
    styleTags: ['scandinavian'],
    dimensions: { x: 0.8, y: 1.8, z: 0.35 },
    color: 0xe8dcc4,
    price: 70,
    features_vector: vec({
      wood_ratio: 0.85, metal_ratio: 0.10,
      warmth: 0.70, lightness: 0.85,
      angularity: 0.55, simplicity: 0.85,
      scale: 0.60, price: 0.30,
    }),
  },

  // ------------------------------- Лофт ----------------------------------
  {
    id: 'shelf_metal',
    name: 'Металлический стеллаж',
    kind: 'shelf',
    styleTags: ['loft'],
    dimensions: { x: 1.0, y: 1.9, z: 0.4 },
    color: 0x5a5a5a,
    price: 110,
    features_vector: vec({
      metal_ratio: 0.90, wood_ratio: 0.05, glass_ratio: 0.05,
      warmth: 0.40, lightness: 0.30,
      angularity: 0.80, simplicity: 0.35,
      scale: 0.65, price: 0.40,
    }),
  },
  {
    id: 'lamp_industrial',
    name: 'Индустриальная лампа',
    kind: 'lamp',
    styleTags: ['loft'],
    dimensions: { x: 0.35, y: 1.5, z: 0.35 },
    color: 0x3c3c3c,
    price: 45,
    features_vector: vec({
      metal_ratio: 0.85, glass_ratio: 0.10,
      warmth: 0.55, lightness: 0.35,
      angularity: 0.70, simplicity: 0.30,
      scale: 0.30, price: 0.20,
    }),
  },
  {
    id: 'sofa_leather',
    name: 'Кожаный диван',
    kind: 'sofa',
    styleTags: ['loft'],
    dimensions: { x: 2.1, y: 0.8, z: 0.95 },
    color: 0x6b4a2f,
    price: 180,
    features_vector: vec({
      metal_ratio: 0.15, textile_ratio: 0.10, wood_ratio: 0.10,
      warmth: 0.55, lightness: 0.30,
      angularity: 0.60, simplicity: 0.40,
      scale: 0.72, price: 0.60,
    }),
  },

  // ------------------------------- Модерн --------------------------------
  {
    id: 'table_glass',
    name: 'Стеклянный стол',
    kind: 'table',
    styleTags: ['modern'],
    dimensions: { x: 1.3, y: 0.72, z: 0.75 },
    color: 0x9fc4d8,
    price: 130,
    features_vector: vec({
      glass_ratio: 0.80, metal_ratio: 0.15,
      warmth: 0.30, lightness: 0.70,
      angularity: 0.70, simplicity: 0.85,
      scale: 0.50, price: 0.45,
    }),
  },
  {
    id: 'media_panel',
    name: 'Медиа-панель',
    kind: 'media',
    styleTags: ['modern'],
    dimensions: { x: 1.6, y: 0.9, z: 0.3 },
    color: 0x2f3640,
    price: 160,
    features_vector: vec({
      glass_ratio: 0.50, metal_ratio: 0.35,
      warmth: 0.20, lightness: 0.45,
      angularity: 0.75, simplicity: 0.80,
      scale: 0.60, price: 0.55,
    }),
  },
  {
    id: 'chair_modern',
    name: 'Стул модерн',
    kind: 'chair',
    styleTags: ['modern'],
    dimensions: { x: 0.5, y: 0.9, z: 0.5 },
    color: 0xb0bec5,
    price: 60,
    features_vector: vec({
      glass_ratio: 0.20, metal_ratio: 0.55, textile_ratio: 0.15,
      warmth: 0.30, lightness: 0.60,
      angularity: 0.70, simplicity: 0.75,
      scale: 0.35, price: 0.25,
    }),
  },

  // --------------------------- Декор / нейтральные -----------------------
  {
    id: 'plant_pot',
    name: 'Комнатное растение',
    kind: 'decor',
    styleTags: ['scandinavian', 'modern'],
    dimensions: { x: 0.4, y: 1.0, z: 0.4 },
    color: 0x4a7c59,
    price: 25,
    features_vector: vec({
      wood_ratio: 0.30, textile_ratio: 0.10,
      warmth: 0.75, lightness: 0.60,
      angularity: 0.25, simplicity: 0.80,
      scale: 0.25, price: 0.15,
    }),
  },
  {
    id: 'rug_soft',
    name: 'Мягкий ковёр',
    kind: 'decor',
    styleTags: ['scandinavian'],
    dimensions: { x: 2.0, y: 0.03, z: 1.4 },
    color: 0xcfb9a0,
    price: 55,
    features_vector: vec({
      textile_ratio: 0.90,
      warmth: 0.80, lightness: 0.75,
      angularity: 0.15, simplicity: 0.85,
      scale: 0.45, price: 0.25,
    }),
  },
  {
    id: 'floor_lamp',
    name: 'Торшер',
    kind: 'lamp',
    styleTags: ['scandinavian', 'modern'],
    dimensions: { x: 0.35, y: 1.6, z: 0.35 },
    color: 0xdedede,
    price: 40,
    features_vector: vec({
      metal_ratio: 0.45, textile_ratio: 0.30,
      warmth: 0.65, lightness: 0.80,
      angularity: 0.45, simplicity: 0.75,
      scale: 0.30, price: 0.20,
    }),
  },
];

/** Нейтральный вектор (fallback для неизвестных предметов). */
const FALLBACK_VECTOR = vec({
  wood_ratio: 0.4, metal_ratio: 0.2, warmth: 0.5, lightness: 0.5,
  angularity: 0.5, simplicity: 0.5, scale: 0.4, price: 0.3,
});

/** Быстрый доступ к предмету каталога по id. */
const CATALOG_BY_ID = Object.fromEntries(ITEM_CATALOG.map(i => [i.id, i]));

/**
 * Возвращает предмет каталога по id.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getCatalogItem(id) {
  return CATALOG_BY_ID[id];
}

/**
 * Возвращает список всех предметов каталога (для библиотеки/инвентаря).
 * @returns {Array<object>}
 */
export function getCatalogItems() {
  return ITEM_CATALOG;
}

/**
 * Универсальный адаптер: извлекает вектор признаков из любого предмета.
 * Приоритеты:
 *   1. item.features_vector (если задан явно и валиден)
 *   2. item.decor?.features_vector
 *   3. Поиск по item.catalogId / item.id в каталоге
 *   4. Поиск по item.kind / item.type в каталоге (первый совпавший)
 *   5. FALLBACK_VECTOR
 * @param {object} item - предмет (из движка или из каталога)
 * @returns {number[]} вектор признаков длины FEATURE_COUNT
 */
export function getItemFeaturesVector(item) {
  if (!item || typeof item !== 'object') return FALLBACK_VECTOR;

  // 1. Явно заданный вектор
  if (isValidVector(item.features_vector)) return item.features_vector;

  // 2. Вложенный decor
  if (item.decor && isValidVector(item.decor.features_vector)) {
    return item.decor.features_vector;
  }

  // 3. По catalogId / id
  const byId = CATALOG_BY_ID[item.catalogId] || CATALOG_BY_ID[item.id];
  if (byId) return byId.features_vector;

  // 4. По kind / type (первый предмет каталога с таким kind)
  const kindKey = item.kind || item.type;
  if (kindKey) {
    const byKind = ITEM_CATALOG.find(i => i.kind === kindKey);
    if (byKind) return byKind.features_vector;
  }

  // 5. Fallback
  return FALLBACK_VECTOR;
}

/**
 * Создаёт экземпляр предмета для размещения в сцене.
 * Возвращает новый объект (не ссылку на каталог), чтобы можно было
 * мутировать позицию/поворот без влияния на каталог.
 * @param {string} catalogId
 * @returns {object|null}
 */
export function createGameItem(catalogId) {
  const proto = CATALOG_BY_ID[catalogId];
  if (!proto) return null;
  return {
    ...proto,
    features_vector: [...proto.features_vector],
    dimensions: { ...proto.dimensions },
  };
}