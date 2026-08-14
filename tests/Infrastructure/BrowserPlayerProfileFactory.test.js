import { describe, expect, it } from 'vitest';
import BrowserPlayerProfileFactory from '../../src/Infrastructure/Factories/BrowserPlayerProfileFactory.js';

describe('BrowserPlayerProfileFactory', () => {
  it('creates a valid profile using injected browser-boundary providers', () => {
    const factory = new BrowserPlayerProfileFactory({
      idProvider: () => 'profile-from-browser-boundary',
      timestampProvider: () => '2026-08-13T09:30:00.000Z'
    });

    const profile = factory.create();

    expect(profile.profileId).toBe('profile-from-browser-boundary');
    expect(profile.createdAt).toBe('2026-08-13T09:30:00.000Z');
  });

  it('rejects factories without both providers', () => {
    expect(() => new BrowserPlayerProfileFactory({ idProvider: () => 'profile-001' })).toThrow('timestampProvider');
    expect(() => new BrowserPlayerProfileFactory({ timestampProvider: () => '2026-08-13T09:30:00.000Z' })).toThrow('idProvider');
  });
});
