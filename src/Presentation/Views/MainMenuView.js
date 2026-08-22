function escape(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function levelCard(level, activeLevelId) {
  const locked = level.isUnlocked === false;
  const progress = Number.isInteger(level.bestStars) ? `<small>Лучший результат: ${level.bestStars}★</small>` : '<small>Новая задача</small>';
  return `
    <button class="menu-level-card${level.id === activeLevelId ? ' is-active' : ''}${locked ? ' is-locked' : ''}" type="button" data-level-id="${escape(level.id)}" ${locked ? 'disabled aria-disabled="true"' : ''}>
      <span class="menu-level-order">${String(level.sortOrder).padStart(2, '0')}</span>
      <span class="menu-level-copy"><b>${escape(level.name)}</b><span>${escape(level.description)}</span>${progress}</span>
      <span class="menu-level-state" aria-hidden="true">${locked ? '⌁' : '→'}</span>
    </button>
  `;
}

export class MainMenuView {
  constructor(container, { onContinue, onCampaign, onEndless, onBack, onSelectLevel, onStartEndless } = {}) {
    if (!container) throw new Error('MainMenuView: container is required.');
    for (const [name, callback] of Object.entries({ onContinue, onCampaign, onEndless, onBack, onSelectLevel, onStartEndless })) {
      if (typeof callback !== 'function') throw new Error(`MainMenuView: ${name} is required.`);
    }
    this.container = container;
    this.callbacks = { onContinue, onCampaign, onEndless, onBack, onSelectLevel, onStartEndless };
    this.isVisible = false;
  }

  render({ screen = 'home', campaignLevels = [], activeLevelId = null, continueLevelId = null, endlessSeed = null, profile = null } = {}) {
    const completedCount = Object.keys(profile?.progress?.completedLevels ?? {}).length;
    const totalLevels = campaignLevels.length;
    const home = `
      <section class="main-menu-home">
        <span class="menu-kicker">DECORIUM · INTERIOR STUDIO</span>
        <h1>Создавайте комнаты,<br>в которые хочется возвращаться.</h1>
        <p>Проходите авторскую кампанию или берите бесконечные заказы с воспроизводимым seed.</p>
        <div class="main-menu-actions">
          <button class="main-menu-button primary" type="button" data-menu-action="continue" ${continueLevelId ? '' : 'disabled'}>Продолжить${continueLevelId ? ` · ${escape(continueLevelId)}` : ''}</button>
          <button class="main-menu-button" type="button" data-menu-action="campaign">Кампания <span>${completedCount}/${totalLevels}</span></button>
          <button class="main-menu-button endless" type="button" data-menu-action="endless">Бесконечный заказ <span>∞</span></button>
        </div>
        <p class="main-menu-note">Каждый предмет и отделка в комнате принадлежат игроку и настраиваются через каталог.</p>
      </section>
    `;
    const campaign = `
      <section class="main-menu-section">
        <header class="main-menu-header"><button class="menu-back" type="button" data-menu-action="back" aria-label="Назад">←</button><div><span class="menu-kicker">КАМПАНИЯ</span><h2>Выберите задание</h2></div></header>
        <p class="main-menu-description">Выполняйте клиентские брифы, открывайте материалы и сохраняйте лучшие результаты.</p>
        <div class="menu-level-grid" role="list">${campaignLevels.map(level => levelCard(level, activeLevelId)).join('')}</div>
      </section>
    `;
    const endless = `
      <section class="main-menu-section endless-menu-section">
        <header class="main-menu-header"><button class="menu-back" type="button" data-menu-action="back" aria-label="Назад">←</button><div><span class="menu-kicker">БЕСКОНЕЧНЫЙ РЕЖИМ</span><h2>Новый клиентский заказ</h2></div></header>
        <p class="main-menu-description">Seed выбирает комнату, стиль и функциональный бриф. Один и тот же seed всегда создаёт тот же заказ и стартовую планировку.</p>
        <div class="endless-seed-card"><span>Текущий seed</span><strong>${endlessSeed ?? '—'}</strong><small>Бесконечные заказы не меняют unlocks кампании.</small></div>
        <div class="main-menu-actions inline">
          <button class="main-menu-button primary" type="button" data-menu-action="new-endless">Сгенерировать новый заказ</button>
          <button class="main-menu-button" type="button" data-menu-action="repeat-endless" ${Number.isInteger(endlessSeed) ? '' : 'disabled'}>Повторить seed</button>
        </div>
      </section>
    `;
    const content = screen === 'campaign' ? campaign : screen === 'endless' ? endless : home;
    this.container.innerHTML = `<div class="main-menu-backdrop"><section class="main-menu-panel" role="dialog" aria-modal="true" aria-label="Главное меню">${content}</section></div>`;
    this.container.hidden = false;
    this.isVisible = true;

    this.container.querySelector('[data-menu-action="continue"]')?.addEventListener('click', () => this.callbacks.onContinue());
    this.container.querySelector('[data-menu-action="campaign"]')?.addEventListener('click', () => this.callbacks.onCampaign());
    this.container.querySelector('[data-menu-action="endless"]')?.addEventListener('click', () => this.callbacks.onEndless());
    this.container.querySelector('[data-menu-action="back"]')?.addEventListener('click', () => this.callbacks.onBack());
    this.container.querySelector('[data-menu-action="new-endless"]')?.addEventListener('click', () => this.callbacks.onStartEndless(null));
    this.container.querySelector('[data-menu-action="repeat-endless"]')?.addEventListener('click', () => this.callbacks.onStartEndless(endlessSeed));
    for (const button of this.container.querySelectorAll('[data-level-id]')) {
      button.addEventListener('click', () => this.callbacks.onSelectLevel(button.dataset.levelId));
    }
  }

  hide() {
    this.container.hidden = true;
    this.isVisible = false;
  }

  destroy() {
    this.container.replaceChildren();
  }
}

export default MainMenuView;
