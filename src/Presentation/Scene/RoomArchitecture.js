import { OPENING_PRESETS, resolveRoomOpenings } from '../../Domain/Rooms/RoomOpenings.js';

const DEFAULT_PRESET = OPENING_PRESETS['living-window-and-door'];

/**
 * Presentation-facing wrapper over the domain opening resolver.
 * The rendered window/door geometry is derived from the same authored preset
 * that gameplay ergonomics enforces, so visuals and rules cannot diverge.
 */
export function getRoomOpenings(width, depth, wallHeight = 3.2, plan = null) {
  return resolveRoomOpenings({ width, depth, wallHeight, preset: plan ?? DEFAULT_PRESET });
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
