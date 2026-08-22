function requirePositiveNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`RoomOccupancyProfile ${name} must be a positive number`);
  }
  return value;
}

function isCoveredByItem(point, item) {
  const dimensions = item?.dimensions;
  const position = item?.position;
  if (!dimensions || !position) return false;
  const width = requirePositiveNumber(dimensions.x, 'item dimensions.x');
  const depth = requirePositiveNumber(dimensions.z, 'item dimensions.z');
  const rotationRadians = -((item.rotation ?? 0) * Math.PI / 180);
  const cosine = Math.cos(rotationRadians);
  const sine = Math.sin(rotationRadians);
  const deltaX = point.x - position.x;
  const deltaZ = point.z - position.z;
  const localX = deltaX * cosine - deltaZ * sine;
  const localZ = deltaX * sine + deltaZ * cosine;
  return Math.abs(localX) <= width / 2 && Math.abs(localZ) <= depth / 2;
}

function rounded(value) {
  return Number(value.toFixed(12));
}

function occupiesFloor(item) {
  const behavior = item?.item?.spatialBehavior ?? item?.spatialBehavior;
  return behavior?.isFloorObstacle === true;
}

export class RoomOccupancyProfile {
  static evaluate({ roomState, cellSizeMeters } = {}) {
    if (!roomState || typeof roomState.getItems !== 'function') {
      throw new Error('RoomOccupancyProfile roomState must provide getItems()');
    }
    const width = requirePositiveNumber(roomState.width, 'room width');
    const depth = requirePositiveNumber(roomState.depth, 'room depth');
    const cellSize = requirePositiveNumber(cellSizeMeters, 'cellSizeMeters');
    const items = roomState.getItems();
    if (!Array.isArray(items)) throw new Error('RoomOccupancyProfile roomState getItems() must return an array');
    const floorObstacles = items.filter(occupiesFloor);

    let occupiedArea = 0;
    for (let x = 0; x < width; x += cellSize) {
      const cellWidth = Math.min(cellSize, width - x);
      for (let z = 0; z < depth; z += cellSize) {
        const cellDepth = Math.min(cellSize, depth - z);
        const point = { x: x + cellWidth / 2, z: z + cellDepth / 2 };
        if (floorObstacles.some(item => isCoveredByItem(point, item))) {
          occupiedArea += cellWidth * cellDepth;
        }
      }
    }
    const roomArea = width * depth;
    const boundedOccupiedArea = Math.min(roomArea, occupiedArea);

    return Object.freeze({
      schemaVersion: 1,
      cellSizeMeters: cellSize,
      roomArea: rounded(roomArea),
      occupiedArea: rounded(boundedOccupiedArea),
      freeAreaRatio: rounded((roomArea - boundedOccupiedArea) / roomArea)
    });
  }
}

export default RoomOccupancyProfile;
