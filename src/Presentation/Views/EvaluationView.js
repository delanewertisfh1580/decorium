function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return Number(value.toFixed(2)).toLocaleString('ru-RU');
}

function channelLabel(channel) {
  return channel === 'ergonomics' ? 'Эргономика' : 'Стиль';
}

function severityLabel(severity) {
  if (severity?.critical) return 'Критично';
  return ({ high: 'Высокая важность', medium: 'Средняя важность', low: 'Низкая важность' })[severity?.level] ?? 'Требует внимания';
}

function completionStatus(explanation) {
  const scorecard = explanation?.scorecard;
  if (!scorecard) return '';
  const state = scorecard.completionEligible === false ? 'blocked' : 'eligible';
  const title = state === 'blocked' ? 'Выполнение заказа заблокировано' : 'Условия завершения выполнены';
  const detail = state === 'blocked'
    ? 'Исправьте критичные пункты, чтобы подтвердить выполнение заказа.'
    : 'Оценка соответствует условиям брифа клиента.';
  return `
    <aside class="completion-status ${state}" data-completion-status="${state}" aria-live="polite">
      <strong>${title}</strong>
      <span>Исходно: ${formatNumber(scorecard.rawScore * 100)}/100 · ${scorecard.rawStars} ★; отображается: ${scorecard.displayStars} ★.</span>
      <p>${detail}</p>
    </aside>
  `;
}

function impactText(impact) {
  const scoreDelta = typeof impact?.totalScoreDelta === 'number'
    ? `+${formatNumber(impact.totalScoreDelta * 100)} к общему score`
    : 'влияние на score недоступно';
  const starsDelta = typeof impact?.displayStarsDelta === 'number' && impact.displayStarsDelta !== 0
    ? `, +${impact.displayStarsDelta} ★`
    : '';
  const completion = impact?.completionEffect === 'restores-completion'
    ? ' · открывает выполнение заказа'
    : impact?.completionEffect === 'blocks-completion'
      ? ' · блокирует выполнение заказа'
      : '';
  return `Улучшение при исправлении: ${scoreDelta}${starsDelta}${completion}.`;
}

function explanationCard(violation) {
  const instances = Array.isArray(violation.instances) ? violation.instances : [];
  const instanceActions = instances.length > 0
    ? `<ul class="explanation-instance-list">${instances.map(instance => `
        <li><button type="button" data-focus-instance="${escapeHtml(instance.instanceId)}" aria-label="Показать ${escapeHtml(instance.displayName)} в комнате">Показать: ${escapeHtml(instance.displayName)}</button></li>
      `).join('')}</ul>`
    : '<p class="explanation-room-scope">Нет размещённых предметов для выбора.</p>';

  return `
    <article class="explanation-card severity-${escapeHtml(violation.severity?.level)}" data-violation-id="${escapeHtml(violation.id)}">
      <header>
        <span class="explanation-severity">${escapeHtml(severityLabel(violation.severity))}</span>
        <span class="explanation-channel">${escapeHtml(channelLabel(violation.channel))}</span>
      </header>
      <h3>${escapeHtml(violation.rule?.description)}</h3>
      <dl class="explanation-facts">
        <div><dt>Фактически</dt><dd>${escapeHtml(formatNumber(violation.fact?.actual))}</dd></div>
        <div><dt>Требуется</dt><dd>${escapeHtml(formatNumber(violation.fact?.desired))}</dd></div>
      </dl>
      <p class="explanation-impact">${escapeHtml(impactText(violation.impact))}</p>
      <p class="explanation-remediation">${escapeHtml(violation.remediation)}</p>
      ${instanceActions}
    </article>
  `;
}

function explanationList(explanation) {
  if (!explanation || explanation.schemaVersion !== 1 || !Array.isArray(explanation.violations) || explanation.violations.length === 0) {
    return '';
  }
  return `<ol class="explanation-list" data-explanation-list>${explanation.violations.map(violation => (
    `<li>${explanationCard(violation)}</li>`
  )).join('')}</ol>`;
}

export class EvaluationView {
  constructor(container, { onFocusInstance = null } = {}) {
    this.container = container;
    if (onFocusInstance !== null && typeof onFocusInstance !== 'function') {
      throw new Error('EvaluationView onFocusInstance must be a function or null');
    }
    this.onFocusInstance = onFocusInstance;
  }

  async init() {}

  render(result) {
    const feedback = Array.isArray(result.feedback) ? result.feedback : [result.feedback];
    const feedbackItems = feedback.filter(Boolean).map(message => `<li>${escapeHtml(message)}</li>`).join('');
    const violations = result.violations?.length
      ? `<p class="score-label">${result.violations.length} подсказок для следующей попытки</p>`
      : '<p class="score-label success-note">Комната собрана гармонично</p>';
    const hasSubScores = typeof result.styleScore === 'number' && typeof result.ergonomicsScore === 'number';
    const subScores = hasSubScores ? `
      <dl class="score-channels" aria-label="Состав оценки">
        <div data-score-channel="style"><dt>Стиль</dt><dd>${Math.round(result.styleScore * 100)}<small>/100</small></dd></div>
        <div data-score-channel="ergonomics"><dt>Эргономика</dt><dd>${Math.round(result.ergonomicsScore * 100)}<small>/100</small></dd></div>
      </dl>
    ` : '';
    const explanation = result.explanation;
    this.container.innerHTML = `
      <section class="evaluation-card panel" aria-labelledby="evaluation-title">
        <button class="close" type="button" data-close aria-label="Закрыть результат">×</button>
        <span class="eyebrow">Итоги комнаты</span>
        <h2 id="evaluation-title">Результат расстановки</h2>
        <div class="evaluation-result-row">
          <div class="stars" aria-label="${result.stars} из 5 звёзд">${'★'.repeat(result.stars)}${'☆'.repeat(5 - result.stars)}</div>
          <div class="evaluation-score">${Math.round(result.score * 100)}<small>/100</small></div>
        </div>
        ${completionStatus(explanation)}
        ${subScores}
        ${violations}
        ${explanationList(explanation)}
        <ul class="feedback">${feedbackItems}</ul>
      </section>
    `;
    this.container.querySelector('[data-close]').onclick = () => this.hide();
    this.container.querySelectorAll('[data-focus-instance]').forEach(button => {
      button.onclick = () => this.onFocusInstance?.(button.dataset.focusInstance);
    });
  }

  hide() { this.container.replaceChildren(); }
  destroy() { this.hide(); }
}
