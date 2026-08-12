const WALL_OPAQUE = 1;
const WALL_FADED = 0.18;
const CAMERA_OUTSIDE_EPSILON = 0.2;

export function getWallOpacities(cameraPosition, roomSize) {
  const { x, z } = cameraPosition;
  const { width, depth } = roomSize;

  return {
    front: z < -CAMERA_OUTSIDE_EPSILON ? WALL_FADED : WALL_OPAQUE,
    back: z > depth + CAMERA_OUTSIDE_EPSILON ? WALL_FADED : WALL_OPAQUE,
    left: x < -CAMERA_OUTSIDE_EPSILON ? WALL_FADED : WALL_OPAQUE,
    right: x > width + CAMERA_OUTSIDE_EPSILON ? WALL_FADED : WALL_OPAQUE
  };
}

export default getWallOpacities;
