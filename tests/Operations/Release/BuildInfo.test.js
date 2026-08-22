import { describe, expect, it } from 'vitest';
import BuildInfo from '../../../src/Operations/Release/BuildInfo.js';

const validBuild = {
  schemaVersion: 1,
  application: 'decorium',
  releaseVersion: '1.0.0',
  sourceRevision: '9e49e788ecf335a8f87f38486c08ed5a8e7f6ce1',
  channel: 'web',
  builtAt: '2026-08-14T18:30:00.000Z'
};

describe('BuildInfo', () => {
  it('rebuilds an immutable versioned release identity from a manifest contract', () => {
    const buildInfo = BuildInfo.fromData(validBuild);

    expect(buildInfo.toJSON()).toEqual(validBuild);
    expect(Object.isFrozen(buildInfo)).toBe(true);
  });

  it.each([
    [{ ...validBuild, schemaVersion: 2 }],
    [{ ...validBuild, application: 'other' }],
    [{ ...validBuild, releaseVersion: 'release-candidate' }],
    [{ ...validBuild, sourceRevision: 'not-a-git-sha' }],
    [{ ...validBuild, channel: 'internal' }],
    [{ ...validBuild, builtAt: 'not-a-timestamp' }]
  ])('rejects an invalid or unsupported release manifest %#', manifest => {
    expect(() => BuildInfo.fromData(manifest)).toThrow();
  });
});
