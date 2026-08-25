const QUALITY_OPTIONS = [
  { value: 'balanced', title: 'Сбалансированное', description: 'Тени и чёткость: хороший вид на большинстве устройств.' },
  { value: 'performance', title: 'Производительность', description: 'Без теней и с меньшей резкостью: для слабых устройств.' }
];

const UI_SCALE_OPTIONS = [
  { value: 'standard', title: 'Обычный', description: 'Компактные панели и элементы управления.' },
  { value: 'large', title: 'Крупный', description: 'Увеличенные кнопки и текст — удобно на планшетах.' }
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Persisted player preferences presented as a deliberate modal dialog.
 * The view owns markup only: policy and persistence stay in Application.
 */
export class PlayerSettingsView {
  constructor(container, onSettingsRequested) {
    if (!container) throw new Error('PlayerSettingsView: container is required.');
    if (typeof onSettingsRequested !== 'function') {
      throw new Error('PlayerSettingsView: onSettingsRequested is required.');
    }
    this.container = container;
    this.onSettingsRequested = onSettingsRequested;
    this._onKeyDown = event => {
      if (event.key === 'Escape') this.close();
    };
  }

  render(settings) {
    this.container.classList.remove('is-open');
    const optionMarkup = (name, options, selected) => options.map(option => `
      <label class="settings-option${option.value === selected ? ' is-active' : ''}" data-settings-option="${escapeHtml(name)}/${escapeHtml(option.value)}">
        <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(option.value)}" ${option.value === selected ? 'checked' : ''} tabindex="-1" aria-hidden="true">
        <span class="settings-option-title">${escapeHtml(option.title)}</span>
        <span class="settings-option-description">${escapeHtml(option.description)}</span>
      </label>`).join('');

    this.container.innerHTML = `
      <section class="settings-modal" data-player-settings role="dialog" aria-modal="true" aria-labelledby="player-settings-title">
        <div class="settings-card">
          <header class="settings-header">
            <h2 id="player-settings-title">Настройки</h2>
            <p>Применяются ко всем заказам и сохраняются в профиле игрока.</p>
            <button class="settings-close" type="button" data-settings-close aria-label="Закрыть настройки">×</button>
          </header>
          <form class="settings-form">
            <input type="hidden" name="qualityTier" data-setting="qualityTier" value="${escapeHtml(settings.qualityTier)}">
            <input type="hidden" name="uiScale" data-setting="uiScale" value="${escapeHtml(settings.uiScale)}">
            <div class="settings-field">
              <span class="settings-field-label">Качество графики</span>
              <fieldset data-settings-group="qualityTier">${optionMarkup('qualityTier', QUALITY_OPTIONS, settings.qualityTier)}</fieldset>
            </div>
            <div class="settings-field">
              <span class="settings-field-label">Масштаб интерфейса</span>
              <fieldset data-settings-group="uiScale">${optionMarkup('uiScale', UI_SCALE_OPTIONS, settings.uiScale)}</fieldset>
            </div>
            <div class="settings-field">
              <label class="settings-option settings-switch${settings.reducedMotion ? ' is-active' : ''}" data-settings-switch>
                <input data-setting="reducedMotion" type="checkbox" ${settings.reducedMotion ? 'checked' : ''}>
                <span class="settings-option-title">Уменьшить анимацию</span>
                <span class="settings-switch-track"></span>
                <span class="settings-option-description">Появление панелей и движение предметов становятся мгновенными.</span>
              </label>
            </div>
            <footer class="settings-footer">
              <span class="settings-footer-note">Настройки хранятся в профиле игрока.</span>
              <button class="settings-save" type="submit">Применить</button>
            </footer>
          </form>
        </div>
      </section>
    `;

    for (const group of ['qualityTier', 'uiScale']) {
      const hiddenInput = this.container.querySelector(`[data-setting="${group}"]`);
      const options = [...this.container.querySelectorAll(`[data-settings-option^="${group}/"]`)];
      for (const option of options) {
        option.addEventListener('click', () => {
          const value = option.dataset.settingsOption.split('/')[1];
          hiddenInput.value = value;
          for (const candidate of options) candidate.classList.toggle('is-active', candidate === option);
        });
      }
    }

    const motionInput = this.container.querySelector('[data-setting="reducedMotion"]');
    this.container.querySelector('[data-settings-switch]').addEventListener('click', event => {
      if (event.target !== motionInput) {
        // The label would otherwise forward a second click and cancel our toggle.
        event.preventDefault();
        motionInput.checked = !motionInput.checked;
      }
      event.currentTarget.classList.toggle('is-active', motionInput.checked);
    });

    this.container.querySelector('[data-settings-close]').addEventListener('click', () => this.close());
    this.container.addEventListener('click', event => {
      if (event.target === this.container) this.close();
    });

    this.container.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      this.onSettingsRequested({
        reducedMotion: this.container.querySelector('[data-setting="reducedMotion"]').checked,
        uiScale: this.container.querySelector('[data-setting="uiScale"]').value,
        qualityTier: this.container.querySelector('[data-setting="qualityTier"]').value
      });
    });
  }

  open() {
    this.container.classList.add('is-open');
    document.addEventListener('keydown', this._onKeyDown);
  }

  close() {
    this.container.classList.remove('is-open');
    document.removeEventListener('keydown', this._onKeyDown);
  }

  get isOpen() {
    return this.container.classList.contains('is-open');
  }
}

export default PlayerSettingsView;
