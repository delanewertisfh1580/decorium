export class ReleaseInfoView {
  constructor(container) {
    if (!container) throw new Error('ReleaseInfoView: container is required.');
    this.container = container;
  }

  renderAvailable(buildInfo) {
    if (!buildInfo?.releaseVersion || !buildInfo?.sourceRevision || !buildInfo?.channel) {
      throw new Error('ReleaseInfoView: complete build info is required.');
    }
    this.container.innerHTML = `
      <p class="release-info" data-release-info role="status" aria-label="Версия игры">
        Версия v${buildInfo.releaseVersion} · ${buildInfo.channel} · ${buildInfo.sourceRevision.slice(0, 7)}
      </p>
    `;
  }

  renderUnavailable() {
    this.container.innerHTML = `
      <p class="release-info release-info-unavailable" data-release-info role="status">
        Сведения о версии недоступны
      </p>
    `;
  }
}

export default ReleaseInfoView;
