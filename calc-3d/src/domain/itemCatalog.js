// =============================================================================
// itemCatalog.js — Каталог игровых предметов Decorium.
//
// Каждый предмет содержит:
//   dimensions      — габариты в метрах {x,y,z} для 3D-меша
//   features_vector — нормализованный вектор признаков (см. features.js)
//   tags            — стилевые/функциональные теги
//
// Функция getItemFeatures(item) возвращает вектор признаков для ЛЮБОГО предмета
// движка: сначала смотрит на item.features_vector, затем ищет в каталоге
// по item.catalogId / item.kind, иначе возвращает нейтральный вектор.
// Это позволяет интегрироваться с существующим factory.js без его переписывания.
// =============================================================================

import { FEATURE_COUNT, FEATURE_KEYS, vectorFromObject, isValidVector } from './features.js';

// -----------------------------------------------------------------------------
// Каталоги предметов под каждый стиль (для MVP: 12 предметов)
// Векторы построены так, чтобы игрок мог собрать как хороший, так и плохой интерьер
// -----------------------------------------------------------------------------
export const ITEM_CATALOG = [
  // --- Скандинавский ---
  {
    catalogId: 'sofa_scandi',
    name: 'Скандинавский диван',
    kind: 'sofa',
    dimensions: { x: 2.0, y: 0.8, z: 0.9 },
    color: 0xd9c8a9,
    tags: ['скандинавский', 'диван', 'мебель'],
    features: vectorFromObject({
      wood_ratio: 0.9, metal_ratio: 0.05, glass_ratio: 0.0, textile_ratio: 0.3,
      warmth: 0.8, lightness: 0.8, angularity: 0.3, simplicity: 0.9,
      scale: 0.8, price: 0.5,
    }),
  },
  {
    catalogId: 'table_scandi',
    name: 'Деревянный стол',
    kind: 'table',
    dimensions: { x: 1.4, y: 0.75, z: 0.8 },
    color: 0xc9a877,
    tags: ['скандинавский', 'стол', 'мебель'],
    features: vectorFromObject({
      wood_ratio: 0.95, metal_ratio: 0.05, glass_ratio: 0.0, textile_ratio: 0.0,
      warmth: 0.75, lightness: 0.75, angularity: 0.4, simplicity: 0.85,
      scale: 0.5, price: 0.35,
    }),
  },
  {
    catalogId: 'armchair_scandi',
    name: 'Кресло из ротанга',
    kind: 'chair',
    dimensions: { x: 0.8, y: 0.9, z: 0.8 },
    color: 0xe0cda9,
    tags: ['скандинавский', 'кресло', 'мебель'],
    features: vectorFromObject({
      wood_ratio: 0.8, metal_ratio: 0.0, glass_ratio: 0.0, textile_ratio: 0.4,
      warmth: 0.85, lightness: 0.85, angularity: 0.2, simplicity: 0.8,
      scale: 0.3, price: 0.3,
    }),
  },

  // --- Лофт ---
  {
    catalogId: 'shelf_metal',
    name: 'Металлический стеллаж',
    kind: 'shelf',
    dimensions: { x: 1.2, y: 1.8, z: 0.4 },
    color: 0x55595e,
    tags: ['лофт', 'стеллаж', 'хранение'],
    features: vectorFromObject({
      wood_ratio: 0.1, metal_ratio: 0.9, glass_ratio: 0.05, textile_ratio: 0.0,
      warmth: 0.3, lightness: 0.3, angularity: 0.8, simplicity: 0.35,
      scale: 0.6, price: 0.4,
    }),
  },
  {
    catalogId: 'lamp_industrial',
    name: 'Индустриальная лампа',
    kind: 'lamp',
    dimensions: { x: 0.4, y: 1.5, z: 0.4 },
    color: 0x3a3f44,
    tags: ['лофт', 'освещение', 'лампа'],
    features: vectorFromObject({
      wood_ratio: 0.0, metal_ratio: 0.85, glass_ratio: 0.1, textile_ratio: 0.0,
      warmth: 0.5, lightness: 0.35, angularity: 0.7, simplicity: 0.3,
      scale: 0.2, price: 0.2,
    }),
  },
  {
    catalogId: 'sofa_leather',
    name: 'Кожаный диван',
    kind: 'sofa',
    dimensions: { x: 2.2, y: 0.75, z: 0.95 },
    color: 0x6b4a2f,
    tags: ['лофт', 'диван', 'мебель'],
    features: vectorFromObject({
      wood_ratio: 0.2, metal_ratio: 0.2, glass_ratio: 0.0, textile_ratio: 0.6,
      warmth: 0.5, lightness: 0.3, angularity: 0.5, simplicity: 0.4,
      scale: 0.8, price: 0.7,
    }),
  },

  // --- Модерн ---
  {
    catalogId: 'table_glass',
    name: 'Стеклянный стол',
    kind: 'table',
    dimensions: { x: 1.3, y: 0.7, z: 0.7 },
    color: 0xa8c8d8,
    tags: ['модерн', 'стол', 'мебель'],
    features: vectorFromObject({
      wood_ratio: 0.0, metal_ratio: 0.2, glass_ratio: 0.8, textile_ratio: 0.0,
      warmth: 0.3, lightness: 0.7, angularity: 0.7, simplicity: 0.85,
      scale: 0.5, price: 0.5,
    }),
  },
  {
    catalogId: 'chair_modern',
    name: 'Стул минималистичный',
    kind: 'chair',
    dimensions: { x: 0.5, y: 0.9, z: 0.5 },
    color: 0xe8e8e8,
    tags: ['модерн', 'стул', 'мебель'],
    features: vectorFromObject({
      wood_ratio: 0.1, metal_ratio: 0.3, glass_ratio: 0.1, textile_ratio: 0.2,
      warmth: 0.2, lightness: 0.8, angularity: 0.7, simplicity: 0.9,
      scale: 0.25, price: 0.25,
    }),
  },
  {
    catalogId: 'media_panel',
    name: 'Медиа-панель',
    kind: 'tv',
    dimensions: { x: 1.8, y: 0.5, z: 0.4 },
    color: 0x2b2b2b,
    tags: ['модерн', 'техника', 'медиа'],
    features: vectorFromObject({
      wood_ratio: 0.1, metal_ratio: 0.3, glass_ratio: 0.5, textile_ratio: 0.0,
      warmth: 0.2, lightness: 0.4, angularity: 0.75, simplicity: 0.8,
      scale: 0.5, price: 0.6,
    }),
  },

  // --- Декор (универсальный) ---
  {
    catalogId: 'plant_pot',
    name: 'Растение в горшке',
    kind: 'decor',
    dimensions: { x: 0.4, y: 1.2, z: 0.4 },
    color: 0x4a7c3a,
    tags: ['декор', 'растение'],
    features: vectorFromObject({
      wood_ratio: 0.3, metal_ratio: 0.0, glass_ratio: 0.0, textile_ratio: 0.0,
      warmth: 0.7, lightness: 0.6, angularity: 0.1, simplicity: 0.7,
      scale: 0.15, price: 0.1,
    }),
  },
  {
    catalogId: 'rug_soft',
    name: 'Мягкий ковёр',
    kind: 'decor',
    dimensions: { x: 2.0, y: 0.05, z: 1.4 },
    color: 0xb8a898,
    tags: ['декор', 'текстиль', 'ковёр'],
    features: vectorFromObject({
      wood_ratio: 0.0, metal_ratio: 0.0, glass_ratio: 0.0, textile_ratio: 0.95,
      warmth: 0.7, lightness: 0.6, angularity: 0.0, simplicity: 0.6,
      scale: 0.4, price: 0.2,
    }),
  },
  {
    catalogId: 'floor_lamp',
    name: 'Торшер',
    kind: 'lamp',
    dimensions: { x: 0.35, y: 1.6, z: 0.35 },
    color: 0xd8d0c0,
    tags: ['декор', 'освещение'],
    features: vectorFromObject({
      wood_ratio: 0.2, metal_ratio: 0.4, glass_ratio: 0.1, textile_ratio: 0.3,
      warmth: 0.6, lightness: 0.7, angularity: 0.3, simplicity: 0.7,
      scale: 0.2, price: 0.2,
    }),
  },
];

// Нейтральный вектор (fallback): предмет без выраженного стиля
const NEUTRAL_VECTOR = new Array(FEATURE_COUNT).fill(0.3);

// Быстрый поиск предмета каталога по catalogId
const CATALOG_BY_ID = Object.fromEntries(ITEM_CATALOG.map((it) => [it.catalogId, it]));

/**
 * Возвращает список игровых предметов для библиотеки (инвентаря).
 * @returns {Array}
 */
export function getCatalogItems() {
  return ITEM_CATALOG;
}

/**
 * Возвращает предмет каталога по catalogId.
 * @param {string} catalogId
 * @returns {Object|null}
 */
export function getCatalogItem(catalogId) {
  return CATALOG_BY_ID[catalogId] ?? null;
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ ЭТАПА 1: получить вектор признаков для предмета.
 *
 * Работает с ЛЮБЫМ предметом движка:
 *  1) если у предмета уже есть item.features_vector — используем его;
 *  2) если есть item.catalogId / item.kind — ищем в каталоге;
 *  3) иначе возвращаем нейтральный вектор.
 *
 * @param {Object} item — предмет из state.js / manager.js
 * @returns {number[]} вектор признаков длиной FEATURE_COUNT
 */
export function getItemFeatures(item) {
  if (!item) return NEUTRAL_VECTOR;

  // 1) Явно заданный вектор на предмете
  if (item.features_vector && isValidVector(item.features_vector)) {
    return item.features_vector;
  }

  // 2) Привязка к каталогу по catalogId или kind
  const key = item.catalogId ?? item.kind ?? item.type ?? item.name;
  const preset = CATALOG_BY_ID[key];
  if (preset?.features) return preset.features;

  // 3) Fallback
  return NEUTRAL_VECTOR;
}