import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';
import LoadPlayerProfileUseCase from '../../../src/Application/UseCases/LoadPlayerProfileUseCase.js';

const timestamp = '2026-08-13T09:30:00.000Z';

function createProfile(profileId = 'profile-001') {
  return PlayerProfile.create({ profileId, timestamp });
}

class MockProfileRepository {
  constructor(loadResult, saveResult = true) {
    this.loadResult = loadResult;
    this.saveResult = saveResult;
    this.savedProfiles = [];
  }

  async load() {
    return this.loadResult;
  }

  async save(profile) {
    this.savedProfiles.push(profile);
    return this.saveResult;
  }
}

class MockProfileFactory {
  constructor(profile = createProfile('new-profile-001')) {
    this.profile = profile;
    this.callCount = 0;
  }

  create() {
    this.callCount += 1;
    return this.profile;
  }
}

describe('LoadPlayerProfileUseCase', () => {
  it('returns the restored profile without overwriting it', async () => {
    const profile = createProfile();
    const repository = new MockProfileRepository({ profile, status: 'restored' });
    const factory = new MockProfileFactory();
    const useCase = new LoadPlayerProfileUseCase(repository, factory);

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.status).toBe('restored');
    expect(result.data).toBe(profile);
    expect(factory.callCount).toBe(0);
    expect(repository.savedProfiles).toHaveLength(0);
  });

  it('creates and persists a default profile when storage is empty', async () => {
    const profile = createProfile('new-profile-001');
    const repository = new MockProfileRepository({ profile: null, status: 'missing' });
    const factory = new MockProfileFactory(profile);
    const useCase = new LoadPlayerProfileUseCase(repository, factory);

    const result = await useCase.execute();

    expect(result).toMatchObject({ success: true, status: 'created', data: profile });
    expect(factory.callCount).toBe(1);
    expect(repository.savedProfiles).toEqual([profile]);
  });

  it('creates and persists a replacement profile after storage recovery', async () => {
    const profile = createProfile('recovered-profile-001');
    const repository = new MockProfileRepository({ profile: null, status: 'recovered' });
    const factory = new MockProfileFactory(profile);
    const useCase = new LoadPlayerProfileUseCase(repository, factory);

    const result = await useCase.execute();

    expect(result).toMatchObject({ success: true, status: 'recovered', data: profile });
    expect(repository.savedProfiles).toEqual([profile]);
  });

  it('returns a persistence error when a newly created profile cannot be saved', async () => {
    const repository = new MockProfileRepository({ profile: null, status: 'missing' }, false);
    const useCase = new LoadPlayerProfileUseCase(repository, new MockProfileFactory());

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    expect(result.error).toContain('PERSISTENCE_ERROR');
  });

  it('rejects missing ports at construction time', () => {
    expect(() => new LoadPlayerProfileUseCase()).toThrow('profileRepository');
    expect(() => new LoadPlayerProfileUseCase(new MockProfileRepository())).toThrow('profileFactory');
  });
});
