export class PlayerSettingsView {
  constructor(container, onSettingsRequested) {
    if (!container) throw new Error('PlayerSettingsView: container is required.');
    if (typeof onSettingsRequested !== 'function') {
      throw new Error('PlayerSettingsView: onSettingsRequested is required.');
    }
    this.container = container;
    this.onSettingsRequested = onSettingsRequested;
  }

  render(settings) {
    this.container.innerHTML = `
      <details class="player-settings" data-player-settings>
        <summary class="player-settings-toggle">Настройки</summary>
        <form class="player-settings-form">
          <label class="player-settings-option player-settings-checkbox">
            <input data-setting="reducedMotion" type="checkbox" ${settings.reducedMotion ? 'checked' : ''}>
            <span>Уменьшить анимацию</span>
          </label>
          <label class="player-settings-option">
            <span>Масштаб интерфейса</span>
            <select data-setting="uiScale">
              <option value="standard" ${settings.uiScale === 'standard' ? 'selected' : ''}>Обычный</option>
              <option value="large" ${settings.uiScale === 'large' ? 'selected' : ''}>Крупный</option>
            </select>
          </label>
          <label class="player-settings-option">
            <span>Качество графики</span>
            <select data-setting="qualityTier">
              <option value="balanced" ${settings.qualityTier === 'balanced' ? 'selected' : ''}>Сбалансированное</option>
              <option value="performance" ${settings.qualityTier === 'performance' ? 'selected' : ''}>Производительность</option>
            </select>
          </label>
          <button class="player-settings-save" type="submit">Сохранить настройки</button>
        </form>
      </details>
    `;

    this.container.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      this.onSettingsRequested({
        reducedMotion: this.container.querySelector('[data-setting="reducedMotion"]').checked,
        uiScale: this.container.querySelector('[data-setting="uiScale"]').value,
        qualityTier: this.container.querySelector('[data-setting="qualityTier"]').value
      });
    });
  }
}

export default PlayerSettingsView;
