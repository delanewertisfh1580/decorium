// =============================================================================
// ergonomics.js — Оценка эргономики и пространственной организации.
// Проверяет геометрические отношения между предметами:
//   1. Проходимость: минимальное расстояние между предметами (>= 0.9 м / 36").
//   2. Соотношение высот: кофейный столик не выше сиденья дивана.
//   3. Баланс визуального веса: равномерность распределения предметов (сетка 3x3).
//
// Каждый штраф нормализуется, суммируется, и к сумме применяется
// экспоненциальная функция score = exp(-λ · totalPenalty) — та же, что и для стиля.
// Модуль автономен (не зависит от scoring.js), чтобы избежать циклических импортов.
// =============================================================================

/** Минимальный проход между предметами, метры (~36 дюймов из GDD). */
export const MIN_PASSAGE = 0.9;

/** Размер сетки для проверки баланса визуального веса. */
const BALANCE_GRID = 3;

/** Порог нормализованной дисперсии, выше которого начисляется штраф за дисбаланс. */
const BALANCE_VARIANCE_THRESHOLD = 0.5;

/** Допустимая разница высот «столик выше дивана», метры. */
const HEIGHT_TOLERANCE = 0.05;

/** Коэффициент, связывающий габариты предметов с требуемым проходом. */
const SIZE_PASSAGE_FACTOR = 0.4;

/**
 * Универсальный адаптер: извлекает позицию и габариты из любого предмета.
 * Поддерживает форматы: item.position / item.mesh.position / item.pos,
 *                        item.dimensions / item.dims / item.size / item.bbox.
 * @param {object} item
 * @returns {{position: {x,y,z}|null, size: {x,y,z}, id:*, kind:*}}
 */
export function getPlacement(item) {
  if (!item || typeof item !== 'object') {
    return { position: null, size: { x: 1, y: 1, z: 1 }, id: null, kind: null };
  }

  // --- Позиция ---
  let position = null;
  const src = item.position || item.pos || (item.mesh && item.mesh.position);
  if (src && Number.isFinite(src.x) && Number.isFinite(src.z)) {
    position = { x: src.x, y: src.y || 0, z: src.z };
  }

  // --- Габариты ---
  let size = null;
  const dims = item.dimensions || item.dims || item.size || item.bbox;
  if (dims && (dims.x !== undefined || dims.w !== undefined)) {
    size = {
      x: dims.x ?? dims.w ?? 1,
      y: dims.y ?? dims.h ?? 1,
      z: dims.z ?? dims.d ?? 1,
    };
  } else if (item.mesh && item.mesh.scale) {
    // Fallback: масштаб меша (если базовый меш — единичный куб)
    const s = item.mesh.scale;
    size = { x: Math.abs(s.x) || 1, y: Math.abs(s.y) || 1, z: Math.abs(s.z) || 1 };
  } else {
    size = { x: 1, y: 1, z: 1 };
  }

  return {
    position,
    size,
    id: item.id ?? item.catalogId ?? null,
    kind: item.kind ?? item.type ?? null,
    name: item.name ?? null,
  };
}

/**
 * Площадь «следа» предмета на полу (для взвешенного среднего в scoring).
 * @param {object} item
 * @returns {number} площадь в м²
 */
export function getFootprintArea(item) {
  const { size } = getPlacement(item);
  return size.x * size.z;
}

/**
 * Проверка 1: Проходимость.
 * Для каждой пары предметов проверяем, что расстояние между центрами по XZ
 * не меньше MIN_PASSAGE + поправка на габариты. Иначе — штраф.
 * @param {Array} placements - массив результатов getPlacement
 * @returns {{totalPenalty:number, violations:Array}}
 */
function checkPassages(placements) {
  const violations = [];
  let totalPenalty = 0;

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      if (!a.position || !b.position) continue;

      const dx = a.position.x - b.position.x;
      const dz = a.position.z - b.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const avgDimA = (a.size.x + a.size.z) / 2;
      const avgDimB = (b.size.x + b.size.z) / 2;
      const minDist = MIN_PASSAGE + SIZE_PASSAGE_FACTOR * (avgDimA + avgDimB);

      if (dist < minDist) {
        const deficit = (minDist - dist) / MIN_PASSAGE; // нормализованный штраф
        totalPenalty += deficit;
        violations.push({
          type: 'ergonomics',
          rule: 'passage',
          items: [a.id, b.id],
          names: [a.name, b.name],
          distance: +dist.toFixed(2),
          required: +minDist.toFixed(2),
          deficit: +deficit.toFixed(3),
        });
      }
    }
  }
  return { totalPenalty, violations };
}

/**
 * Проверка 2: Соотношение высот.
 * Кофейный/приставной столик не должен быть заметно выше сиденья дивана.
 * @param {Array} placements
 * @returns {{totalPenalty:number, violations:Array}}
 */
function checkHeightRatios(placements) {
  const violations = [];
  let totalPenalty = 0;

  const tables = placements.filter(p => p.kind === 'table');
  const sofas = placements.filter(p => p.kind === 'sofa' || p.kind === 'chair');

  for (const table of tables) {
    for (const sofa of sofas) {
      if (table.size.y > sofa.size.y + HEIGHT_TOLERANCE) {
        const deficit = Math.min((table.size.y - sofa.size.y) / 0.3, 1.5);
        totalPenalty += deficit;
        violations.push({
          type: 'ergonomics',
          rule: 'height_ratio',
          items: [table.id, sofa.id],
          names: [table.name, sofa.name],
          deficit: +deficit.toFixed(3),
        });
      }
    }
  }
  return { totalPenalty, violations };
}

/**
 * Проверка 3: Баланс визуального веса.
 * Делим комнату на сетку 3x3, считаем число предметов в каждой ячейке.
 * Высокая дисперсия => вся мебель в одном углу => штраф.
 * @param {Array} placements
 * @param {{minX,maxX,minZ,maxZ}} bounds - границы комнаты
 * @returns {{totalPenalty:number, violations:Array}}
 */
function checkBalance(placements, bounds) {
  if (!bounds || placements.length < 2) return { totalPenalty: 0, violations: [] };

  const grid = new Array(BALANCE_GRID * BALANCE_GRID).fill(0);
  const { minX, maxX, minZ, maxZ } = bounds;
  const cellW = Math.max(0.001, (maxX - minX) / BALANCE_GRID);
  const cellD = Math.max(0.001, (maxZ - minZ) / BALANCE_GRID);

  for (const p of placements) {
    if (!p.position) continue;
    const col = Math.min(BALANCE_GRID - 1, Math.max(0, Math.floor((p.position.x - minX) / cellW)));
    const row = Math.min(BALANCE_GRID - 1, Math.max(0, Math.floor((p.position.z - minZ) / cellD)));
    grid[row * BALANCE_GRID + col] += 1;
  }

  const mean = grid.reduce((s, v) => s + v, 0) / grid.length;
  const variance = grid.reduce((s, v) => s + (v - mean) ** 2, 0) / grid.length;
  const normalizedVariance = variance / (mean || 1);

  if (normalizedVariance > BALANCE_VARIANCE_THRESHOLD) {
    const deficit = normalizedVariance - BALANCE_VARIANCE_THRESHOLD;
    return {
      totalPenalty: deficit,
      violations: [{
        type: 'ergonomics',
        rule: 'balance',
        deficit: +deficit.toFixed(3),
        grid: [...grid],
      }],
    };
  }
  return { totalPenalty: 0, violations: [] };
}

/**
 * Автоматически определяет границы комнаты по позициям предметов (с отступом).
 * @param {Array} placements
 * @returns {{minX,maxX,minZ,maxZ}}
 */
function computeBounds(placements) {
  const withPos = placements.filter(p => p.position);
  if (withPos.length === 0) return { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };
  const xs = withPos.map(p => p.position.x);
  const zs = withPos.map(p => p.position.z);
  const pad = 2;
  return {
    minX: Math.min(...xs) - pad,
    maxX: Math.max(...xs) + pad,
    minZ: Math.min(...zs) - pad,
    maxZ: Math.max(...zs) + pad,
  };
}

/**
 * Главная функция оценки эргономики.
 * @param {Array<object>} items - размещённые предметы
 * @param {{minX,maxX,minZ,maxZ}|null} roomBounds - границы комнаты (опционально)
 * @param {number} lambda - коэффициент крутизны экспоненты
 * @returns {{score:number, totalPenalty:number, violations:Array, checks:object, bounds:object}}
 */
export function evaluateErgonomics(items, roomBounds = null, lambda = 1.5) {
  if (!Array.isArray(items) || items.length === 0) {
    return { score: 1, totalPenalty: 0, violations: [], checks: {}, bounds: roomBounds };
  }

  const placements = items.map(getPlacement).filter(p => p.position);
  if (placements.length === 0) {
    return { score: 1, totalPenalty: 0, violations: [], checks: {}, bounds: roomBounds };
  }

  const bounds = roomBounds || computeBounds(placements);

  const passage = checkPassages(placements);
  const height = checkHeightRatios(placements);
  const balance = checkBalance(placements, bounds);

  const totalPenalty = passage.totalPenalty + height.totalPenalty + balance.totalPenalty;
  const score = Math.exp(-lambda * totalPenalty);

  return {
    score,
    totalPenalty: +totalPenalty.toFixed(3),
    violations: [...passage.violations, ...height.violations, ...balance.violations],
    checks: { passage, height, balance },
    bounds,
  };
}