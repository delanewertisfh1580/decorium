const freeze = value => Object.freeze(value);

export function getRoomOpenings(width, depth, wallHeight = 3.2) {
  const windowHeight = 1.35;
  const windowBottom = 1.25;
  const windowWidth = Math.min(2.15, width * 0.34);
  const windowCenterX = width * 0.68;

  return freeze({
    window: freeze({
      centerX: windowCenterX,
      width: windowWidth,
      height: windowHeight,
      bottom: windowBottom,
      top: windowBottom + windowHeight,
      glassOpacity: 0.24
    }),
    door: freeze({
      wall: 'left',
      centerZ: depth * 0.72,
      width: 0.9,
      height: Math.min(2.2, wallHeight - 0.45),
      color: 0x394b52
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
