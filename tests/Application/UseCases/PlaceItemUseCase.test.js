import { describe, it, expect, beforeEach } from 'vitest';
import PlaceItemUseCase from '../../../src/Application/UseCases/PlaceItemUseCase.js';
import PlacementResultDTO from '../../../src/Application/DTOs/PlacementResultDTO.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

class MockRoomRepository {
  constructor() { this.storage = new Map(); }
  async saveState(roomId, roomState) { this.storage.set(roomId, roomState); return true; }
  async getState(roomId) { return this.storage.get(roomId) || null; }
}

const createTestBounds = () => new RoomBounds(5, 5);
const featureVector = new FeatureVector({
  woodShare: 0.8, metalShare: 0.1, glassShare: 0, plasticShare: 0.05, textileShare: 0,
  lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.6, saturationLevel: 0.3,
  formSimplicity: 0.8, roundnessShare: 0.2, rectilinearShare: 0.8, sizeNorm: 0.5,
  priceNorm: 0.4, lightingFunctionShare: 0, storageFunctionShare: 0
});
function createCatalogItem({ id, name = id, type = 'seating', affordances = ['lounge-seat'] }) {
  return new Item({
    id, name, type, dimensions: { x: 0.5, z: 0.5 }, price: 100, featureVector,
    interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances }),
    spatialBehavior: new SpatialBehavior({
      schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
    })
  });
}

const position = { x: 1, y: 0, z: 2 };
const rotation = { x: 0, y: 0, z: 0, w: 1 };

describe('PlaceItemUseCase', () => {
  let repository;
  let useCase;

  beforeEach(() => {
    repository = new MockRoomRepository();
    useCase = new PlaceItemUseCase(repository);
  });

  it('rejects missing room IDs, non-catalog items, invalid positions and invalid rotations', async () => {
    await expect(useCase.execute('', createCatalogItem({ id: 'item-1' }), position, rotation))
      .resolves.toMatchObject({ success: false, error: expect.stringContaining('INVALID_INPUT') });
    await expect(useCase.execute('room-1', { id: 'raw-item' }, position, rotation))
      .resolves.toMatchObject({ success: false, error: 'INVALID_INPUT: A validated catalog Item is required.' });
    await expect(useCase.execute('room-1', createCatalogItem({ id: 'item-1' }), null, rotation))
      .resolves.toMatchObject({ success: false, error: expect.stringContaining('INVALID_INPUT') });
    await expect(useCase.execute('room-1', createCatalogItem({ id: 'item-1' }), position, null))
      .resolves.toMatchObject({ success: false, error: expect.stringContaining('INVALID_INPUT') });
  });

  it('places a validated catalog item in a loaded room and persists its instance state', async () => {
    const item = createCatalogItem({ id: 'chair-01', name: 'Wooden Chair' });
    await repository.saveState('room-loaded', RoomState.createEmpty(createTestBounds()));

    const result = await useCase.execute('room-loaded', item, position, rotation);

    expect(result.success).toBe(true);
    expect(result.itemId).toBe('chair-01');
    expect(result.position).toEqual(position);
    expect((await repository.getState('room-loaded')).getItem('chair-01').item).toBe(item);
  });

  it('adds a validated catalog item to an existing room', async () => {
    await repository.saveState('room-existing', RoomState.createEmpty(createTestBounds()));
    const item = createCatalogItem({ id: 'table-01', name: 'Table', type: 'surface', affordances: ['coffee-surface'] });

    const result = await useCase.execute('room-existing', item, { x: 1, y: 0, z: 1 }, rotation);

    expect(result.success).toBe(true);
    expect((await repository.getState('room-existing')).getItem('table-01').item).toBe(item);
  });

  it('returns a typed failure for a room that was not loaded', async () => {
    const result = await useCase.execute('room-1', createCatalogItem({ id: 'big-item' }), position, rotation);

    expect(result).toMatchObject({ success: false, error: 'ROOM_NOT_FOUND: Room room-1 not found.' });
    expect(result).toBeInstanceOf(PlacementResultDTO);
  });
});
