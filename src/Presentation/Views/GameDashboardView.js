export class GameDashboardView {
  constructor(container, { renderContextActions = null } = {}) {
    this.container = container ?? null;
    this.renderContextActions = typeof renderContextActions === 'function' ? renderContextActions : null;
    this._isOpen = false;
  }

  render({ roomName, placedCount, evaluation = null, clientBrief = null } = {}) {
    if (!this.container) return;
    const existingSpoiler = this.container.querySelector('[data-dashboard-spoiler]');
    if (existingSpoiler) this._isOpen = existingSpoiler.open;
    const score = evaluation ? Math.round(evaluation.score * 100) : '—';
    const stars = evaluation ? evaluation.stars : 0;
    const clientContext = clientBrief ? `
      <section class="client-brief-context" aria-label="Бриф клиента">
        <span class="eyebrow">Клиент · ${clientBrief.client.displayName}</span>
        <strong>${clientBrief.title}</strong>
        <p>${clientBrief.summary}</p>
        <ul class="client-priorities">${clientBrief.clientPriorities.map(priority => (
          `<li data-client-priority="${priority.id}">${priority.label}</li>`
        )).join('')}</ul>
      </section>
    ` : '';
    this.container.innerHTML = `
      <details class="dashboard-spoiler" data-dashboard-spoiler${this._isOpen ? ' open' : ''}>
        <summary class="dashboard-toggle" aria-label="Открыть сводку оценки">
          <span class="dashboard-toggle-icon" aria-hidden="true">✦</span>
          <span class="dashboard-toggle-copy"><b>Сводка</b><small>${placedCount} предметов</small></span>
          <span class="dashboard-toggle-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="dashboard-content">
          <span class="eyebrow">${roomName}</span>
          ${clientContext}
          <div class="summary-main">
            <div class="summary-score">
              <span class="score-label">Оценка</span>
              <strong class="score-value">${score}</strong>
            </div>
            <div class="stars" aria-label="${stars} из 5 звёзд">${evaluation ? '★'.repeat(stars) + '☆'.repeat(5 - stars) : '☆☆☆☆☆'}</div>
          </div>
          <div class="summary-meta">
            <span><b>${placedCount}</b> предметов</span>
          </div>
          <details class="summary-actions">
            <summary>Действия предмета</summary>
            <div class="context-actions" data-context-actions></div>
          </details>
        </div>
      </details>
    `;
    this.container.querySelector('[data-dashboard-spoiler]').addEventListener('toggle', event => {
      this._isOpen = event.currentTarget.open;
    });
    const contextActions = this.container.querySelector('[data-context-actions]');
    this.renderContextActions?.(contextActions);
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.container = null;
    this.renderContextActions = null;
  }
}

export default GameDashboardView;
