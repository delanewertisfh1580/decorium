import { describe, expect, it } from 'vitest';
import PlayerProfileRepository from '../../../src/Application/Ports/PlayerProfileRepository.js';

describe('PlayerProfileRepository port', () => {
  it('declares load and save as explicit adapter responsibilities', async () => {
    const repository = new PlayerProfileRepository();

    await expect(repository.load()).rejects.toThrow('must be implemented');
    await expect(repository.save({})).rejects.toThrow('must be implemented');
  });
});
