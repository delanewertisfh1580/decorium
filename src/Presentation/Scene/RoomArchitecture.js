const freeze = value => Object.freeze(value);

const DEFAULT_OPENINGS = freeze({
  window: freeze({ widthFactor: 0.34, centerXFactor: 0.68, height: 1.35, bottom: 1.25, glassOpacity: 0.24, maxWidth: 2.15 }),
  door: freeze({ centerZFactor: 0.72, width: 0.9, color: 0x394b52 })
});

function openingPlanFor(plan) {
  return {
    window: { ...DEFAULT_OPENINGS.window, ...(plan?.window ?? {}) },
    door: { ...DEFAULT_OPENINGS.door, ...(plan?.door ?? {}) }
  };
}

export function getRoomOpenings(width, depth, wallHeight = 3.2, plan = null) {
  const preset = openingPlanFor(plan);
  const windowBottom = Math.min(preset.window.bottom, Math.max(0.35, wallHeight - 0.7));
  const windowHeight = Math.min(preset.window.height, wallHeight - windowBottom - 0.08);
  const windowWidth = Math.min(preset.window.maxWidth, width * preset.window.widthFactor);
  const windowCenterX = Math.min(width - windowWidth / 2, Math.max(windowWidth / 2, width * preset.window.centerXFactor));
  const doorWidth = Math.min(depth * 0.6, preset.door.width);
  const doorCenterZ = Math.min(depth - doorWidth / 2, Math.max(doorWidth / 2, depth * preset.door.centerZFactor));

  return freeze({
    window: freeze({
      centerX: windowCenterX,
      width: windowWidth,
      height: windowHeight,
      bottom: windowBottom,
      top: windowBottom + windowHeight,
      glassOpacity: preset.window.glassOpacity
    }),
    door: freeze({
      wall: 'left',
      centerZ: doorCenterZ,
      width: doorWidth,
      height: Math.min(2.2, wallHeight - 0.45),
      color: preset.door.color
    })
  });
}

export function validateRoomOpenings(openings) {
  const errors = [];
  const window = openings?.window;
  const door = openings?.door;
  if (!window || window.bottom <= 0 || window.top <= window.bottom || window.glassOpacity >= 0.5 || window.glassOpacity <= 0) {
    errors.push('window');
  }
  if (!door || door.wall !== 'left' || door.width < 0.8 || door.height < 2 || door.centerZ <= 0) {
    errors.push('door');
  }
  return errors;
}

export default getRoomOpenings;
