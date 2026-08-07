// =============================================================================
// evaluator.js — оркестратор оценки Decorium для движка calc-3d.
// Связывает доменные модули (scoring, ergonomics, feedback) с живым состоянием
// движка: извлекает предметы из state, обогащает их 3D-позициями из мешей,
// преобразует type → features_vector и запускает evaluateRoom.
// v2.0.1: маппинг приведён в соответствие с реальными типами config.js
//         (box, sofa, bike, fridge, shelf).
// =============================================================================

import { evaluateRoom } from '../domain/scoring.js';
import { DEFAULT_STYLE_ID } from '../domain/styles.js';
import { getCatalogItems, createGameItem } from '../domain/itemCatalog.js';

/**
 * Маппинг типов движка (ITEM_TYPES из config.js) к catalogId в itemCatalog.
 * Подобран по материалу/характеру предмета:
 *   box    — картон ≈ дерево/тёплый/простой
 *   sofa   — мягкий диван
 *   bike   — металл, индустриальный характер
 *   fridge — холодный металл/стекло, модерн
 *   shelf  — нейтральный стеллаж
 */
const TYPE_TO_CATALOG_ID = {
  box: 'table_scandi',
  sofa: 'sofa_scandi',
  bike: 'lamp_industrial',
  fridge: 'media_panel',
  shelf: 'shelf_scandi',
};

/**
 * Преобразует предмет state движка в объект, совместимый с itemCatalog.
 * @param {object} stateItem - предмет из getItems()
 * @param {object|null} mesh - Three.js mesh (опционально)
 * @returns {object} обогащённый предмет
 */
function adaptItem(stateItem, mesh) {
  const type = stateItem.type;
  let catalogId = TYPE_TO_CATALOG_ID[type];

  // Fallback: ищем первый предмет каталога с таким же kind
  if (!catalogId) {
    const byKind = getCatalogItems().find(i => i.kind === type);
    if (byKind) catalogId = byKind.id;
    else catalogId = 'sofa_scandi';
  }

  const catalogItem = createGameItem(catalogId);
  const dimensions = catalogItem
    ? catalogItem.dimensions
    : { x: stateItem.w, y: stateItem.h, z: stateItem.d };

  // Позиция: из меша (учитывает падение/опору), иначе из state
  let position = null;
  if (mesh && mesh.position) {
    position = {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
    };
  } else if (typeof stateItem.x === 'number') {
    position = { x: stateItem.x, y: stateItem.y ?? 0, z: stateItem.z };
  }

  return {
    ...stateItem,
    id: stateItem.id,
    name: stateItem.name || (catalogItem && catalogItem.name) || type,
    kind: type,
    dimensions: {
      x: stateItem.w ?? dimensions.x,
      y: stateItem.h ?? dimensions.y,
      z: stateItem.d ?? dimensions.z,
    },
    position,
    features_vector: catalogItem ? catalogItem.features_vector : undefined,
    price: catalogItem ? catalogItem.price : 0,
  };
}

/**
 * Границы комнаты по целевому боксу (для эргономики и баланса 3×3).
 * @param {object} virtualBox
 * @returns {{minX,maxX,minZ,maxZ}}
 */
function computeRoomBounds(virtualBox) {
  if (!virtualBox) return null;
  const box = typeof virtualBox.getTarget === 'function'
    ? virtualBox.getTarget()
    : virtualBox;

  const w = box.w ?? 3;
  const d = box.d ?? 3;
  return { minX: -w / 2, maxX: w / 2, minZ: -d / 2, maxZ: d / 2 };
}

/**
 * Запускает полную оценку комнаты Decorium.
 * @param {object} ctx - { getItems, getMeshes, virtualBox }
 * @param {string} styleId - целевой стиль
 * @returns {object} результат оценки + служебные поля
 */
export function runEvaluation(ctx, styleId = DEFAULT_STYLE_ID) {
  const stateItems = ctx.getItems();
  const meshes = ctx.getMeshes();

  const meshById = new Map();
  for (const m of meshes) {
    if (m.userData && m.userData.id != null) {
      meshById.set(m.userData.id, m);
    }
  }

  const adaptedItems = stateItems.map(item => {
    const mesh = meshById.get(item.id) || null;
    return adaptItem(item, mesh);
  });

  const bounds = computeRoomBounds(ctx.virtualBox);
  const result = evaluateRoom(adaptedItems, styleId, bounds);

  return {
    ...result,
    styleId,
    itemCount: adaptedItems.length,
    bounds,
  };
}

export { getStyleList } from '../domain/styles.js';