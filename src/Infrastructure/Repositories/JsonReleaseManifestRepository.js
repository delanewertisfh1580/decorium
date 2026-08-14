import BuildInfo from '../../Domain/Release/BuildInfo.js';

export default class JsonReleaseManifestRepository {
  constructor(manifestPath = '/release-manifest.json') {
    this.manifestPath = manifestPath;
  }

  async load() {
    const response = await fetch(this.manifestPath);
    if (!response.ok) throw new Error(`Release manifest unavailable: ${response.status}`);
    return BuildInfo.fromData(await response.json());
  }
}
