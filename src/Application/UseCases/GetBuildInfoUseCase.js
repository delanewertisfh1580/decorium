export default class GetBuildInfoUseCase {
  constructor(releaseManifestRepository) {
    if (!releaseManifestRepository || typeof releaseManifestRepository.load !== 'function') {
      throw new Error('GetBuildInfoUseCase requires a release manifest repository.');
    }
    this.releaseManifestRepository = releaseManifestRepository;
  }

  async execute() {
    try {
      const buildInfo = await this.releaseManifestRepository.load();
      return { success: true, data: buildInfo };
    } catch {
      return { success: false, error: 'BUILD_INFO_UNAVAILABLE' };
    }
  }
}
