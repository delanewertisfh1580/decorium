// =============================================================================
// evaluator.js — Оркестратор оценки Decorium для движка calc-3d.
// Связывает доменные модули (scoring, ergonomics, feedback) с живым состоянием
// движка: извлекает предметы из state, обогащает их 3D-позициями из мешей,
// преобразует type → features_vector и запускает evaluateRoom.
// Модуль не импортирует three — работает с мешами как с объектами с .position/.scale.
// =============================================================================

import { evaluateRoom } from '../domain/scoring.js';
import { DEFAULT_STYLE_ID } from '../domain/styles.js';
import { getCatalogItems, createGameItem } from '../domain/itemCatalog.js';

/**
 * Маппинг типов движка (из config.js ITEM_TYPES) к catalogId в itemCatalog.
 * Если для типа нет прямого соответствия — подбирается первый предмет
 * с таким же kind в каталоге.
 */
const TYPE_TO_CATALOG_ID = {
  box: 'table_scandi',      // базовый бокс → стол (нейтральный декор)
  shelf: 'shelf_scandi',
  bed: 'sofa_scandi',
  sofa: 'sofa_scandi',
  chair: 'chair_modern',
  table: 'table_scandi',
  lamp: 'floor_lamp',
  rug: 'rug_soft',
  plant: 'plant_pot',
};

/**
 * Преобразует предмет state движка в объект, совместимый с itemCatalog
 * (с features_vector, dimensions и position для эргономики).
 * @param {object} stateItem - предмет из getItems()
 * @param {object|null} mesh - Three.js mesh (опционально)
 * @returns {object} обогащённый предмет
 */
function adaptItem(stateItem, mesh) {
  const type = stateItem.type;
  let catalogId = TYPE_TO_CATALOG_ID[type];

  // Fallback: если нет прямого маппинга, ищем первый предмет каталога с таким kind
  if (!catalogId) {
    const byKind = getCatalogItems().find(i => i.kind === type);
    if (byKind) catalogId = byKind.id;
    else catalogId = 'sofa_scandi'; // абсолютный fallback
  }

  const catalogItem = createGameItem(catalogId);
  const dimensions = catalogItem
    ? catalogItem.dimensions
    : { x: stateItem.w, y: stateItem.h, z: stateItem.d };

  // Позиция: центр предмета (y берём из mesh, чтобы учесть support/падение)
  let position = null;
  if (mesh && mesh.position) {
    position = {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
    };
  } else if (typeof stateItem.x === 'number') {
    position = {
      x: stateItem.x,
      y: stateItem.y ?? 0,
      z: stateItem.z,
    };
  }

  return {
    ...stateItem,
    id: stateItem.id,
    name: stateItem.name || catalogItem?.name || type,
    kind: type,
    dimensions: {
      x: stateItem.w ?? dimensions.x,
      y: stateItem.h ?? dimensions.y,
      z: stateItem.d ?? dimensions.z,
    },
    position,
    features_vector: catalogItem?.features_vector,
    price: catalogItem?.price ?? 0,
  };
}

/**
 * Вычисляет границы комнаты по текущему виртуальному боксу (для эргономики).
 * @param {object} virtualBox - экземпляр virtualBox из движка
 * @returns {{minX,maxX,minZ,maxZ}}
 */
function computeRoomBounds(virtualBox) {
  if (!virtualBox) return null;
  const box = typeof virtualBox.getTarget === 'function'
    ? virtualBox.getTarget()
    : virtualBox;

  const w = box.w ?? 3;
  const d = box.d ?? 3;
  // Центр комнаты в (0,0), границы — ±половина размера
  return {
    minX: -w / 2,
    maxX: w / 2,
    minZ: -d / 2,
    maxZ: d / 2,
  };
}

/**
 * Запускает полную оценку комнаты Decorium.
 * @param {object} ctx - контекст движка
 * @param {Function} ctx.getItems - () => Array<stateItem>
 * @param {Function} ctx.getMeshes - () => Array<THREE.Mesh>
 * @param {object} ctx.virtualBox - виртуальный бокс движка
 * @param {string} styleId - целевой стиль (по умолчанию скандинавский)
 * @returns {object} результат оценки (totalScore, stars, violations, ...) + items, styleId
 */
export function runEvaluation(ctx, styleId = DEFAULT_STYLE_ID) {
  const stateItems = ctx.getItems();
  const meshes = ctx.getMeshes();

  // Индекс мешей по id для быстрого доступа
  const meshById = new Map();
  for (const m of meshes) {
    if (m.userData && m.userData.id != null) {
      meshById.set(m.userData.id, m);
    }
  }

  // Адаптируем все предметы: state-запись + 3D-позиция из меша
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

/**
 * Возвращает список доступных стилей для UI.
 */
export { getStyleList } from '../domain/styles.js';