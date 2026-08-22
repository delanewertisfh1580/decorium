const STYLE_LABELS = Object.freeze({
  scandinavian: 'Скандинавский',
  japandi: 'Japandi',
  eclectic: 'Эклектика'
});

function requireBrief(brief) {
  if (!brief || typeof brief !== 'object' || !brief.client || typeof brief.client.displayName !== 'string'
    || typeof brief.title !== 'string' || typeof brief.summary !== 'string'
    || !Array.isArray(brief.clientPriorities) || !Array.isArray(brief.styleTargets)) {
    throw new Error('BriefView brief must provide authored client content');
  }
  return brief;
}

function styleLabel(target) {
  return STYLE_LABELS[target.styleId] ?? target.styleId;
}

/** Renders authored client context; it never calculates score or completion itself. */
export class BriefView {
  constructor(container, { onStartEditing = null, onClose = null } = {}) {
    this.container = container ?? null;
    this.onStartEditing = typeof onStartEditing === 'function' ? onStartEditing : () => {};
    this.onClose = typeof onClose === 'function' ? onClose : () => {};
  }

  render({ brief, mode, levelLabel = 'Комната' } = {}) {
    if (!['launch', 'drawer'].includes(mode)) throw new Error('BriefView mode is not supported');
    const authoredBrief = requireBrief(brief);
    if (!this.container) return;

    const priorityChips = authoredBrief.clientPriorities.map(priority => (
      `<li>${priority.label}</li>`
    )).join('');
    const styleTargets = authoredBrief.styleTargets.map(target => (
      `<li><strong>${styleLabel(target)}</strong><span>${target.role === 'primary' ? 'Основной стиль' : 'Поддерживающий стиль'}</span></li>`
    )).join('');
    const closeAction = mode === 'drawer'
      ? '<button class="brief-close" type="button" data-brief-action="close" aria-label="Закрыть бриф">×</button>'
      : '';
    const startAction = mode === 'launch'
      ? '<button class="brief-primary-action" type="button" data-brief-action="start">Начать оформление</button>'
      : '';

    this.container.innerHTML = `
      <section class="brief-surface" data-brief-mode="${mode}" aria-labelledby="brief-title">
        ${closeAction}
        <span class="brief-eyebrow">CLIENT BRIEF · ${levelLabel}</span>
        <p class="brief-client">${authoredBrief.client.displayName}</p>
        <h1 id="brief-title">${authoredBrief.title}</h1>
        <p class="brief-summary">${authoredBrief.summary}</p>
        <section class="brief-priorities" aria-labelledby="brief-priorities-title">
          <h2 id="brief-priorities-title">Важно для клиента</h2>
          <ul>${priorityChips}</ul>
        </section>
        <section class="brief-criteria" aria-labelledby="brief-criteria-title">
          <h2 id="brief-criteria-title">Критерии оценки</h2>
          <p>Стиль, запросы клиента и эргономика оцениваются отдельно. Критичные функциональные требования должны быть выполнены для завершения заказа.</p>
          <ul class="brief-style-targets">${styleTargets}</ul>
        </section>
        ${mode === 'launch' ? '<p class="brief-start-hint">Все детали брифа останутся доступны во время оформления.</p>' : ''}
        ${startAction}
      </section>
    `;
    if (mode === 'launch') {
      this.container.querySelector('[data-brief-action="start"]')?.addEventListener('click', this.onStartEditing);
    } else {
      this.container.querySelector('[data-brief-action="close"]')?.addEventListener('click', this.onClose);
    }
  }

  hide() {
    this.container?.replaceChildren();
  }

  destroy() {
    this.hide();
    this.container = null;
  }
}

export default BriefView;
