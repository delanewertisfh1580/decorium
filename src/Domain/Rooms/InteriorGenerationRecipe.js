function requireId(value, label) {
  if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`InteriorGenerationRecipe ${label} must be a lowercase identifier.`);
  }
  return value;
}

function freezePlacement(value) {
  if (!value || typeof value !== 'object') throw new Error('InteriorGenerationRecipe placement must be an object.');
  const slotId = requireId(value.slotId, 'placement slotId');
  const itemId = requireId(value.itemId, 'placement itemId');
  const variantId = value.variantId === null || value.variantId === undefined ? null : requireId(value.variantId, 'placement variantId');
  const { position, rotation } = value;
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) {
    throw new Error('InteriorGenerationRecipe placement position must contain finite x, y and z.');
  }
  if (!rotation || !Number.isFinite(rotation.y) || rotation.y % 90 !== 0) {
    throw new Error('InteriorGenerationRecipe placement rotation.y must be a multiple of 90.');
  }
  return Object.freeze({
    slotId,
    itemId,
    variantId,
    position: Object.freeze({ x: position.x, y: position.y, z: position.z }),
    rotation: Object.freeze({ y: rotation.y })
  });
}

export class InteriorGenerationRecipe {
  constructor({ id, label, placements }) {
    this._id = requireId(id, 'id');
    if (typeof label !== 'string' || label.trim() === '') throw new Error('InteriorGenerationRecipe label is required.');
    if (!Array.isArray(placements)) throw new Error('InteriorGenerationRecipe placements must be an array.');
    const normalized = placements.map(freezePlacement);
    const slots = normalized.map(placement => placement.slotId);
    if (new Set(slots).size !== slots.length) throw new Error('InteriorGenerationRecipe placements must have unique slotIds.');
    this._label = label.trim();
    this._placements = Object.freeze(normalized);
    Object.freeze(this);
  }

  get id() { return this._id; }
  get label() { return this._label; }
  get placements() { return this._placements; }
}

export default InteriorGenerationRecipe;
