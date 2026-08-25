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
  if (channel === 'ergonomics') return 'Эргономика';
  if (channel === 'client-priority') return 'Запросы клиента';
  return 'Стиль';
}

function severityLabel(severity) {
  if (severity?.critical) return 'Критично';
  return ({ high: 'Высокая важность', medium: 'Средняя важность', low: 'Низкая важность' })[severity?.level] ?? 'Требует внимания';
}

function severityRank(violation) {
  if (violation.severity?.critical) return 4;
  return ({ high: 3, medium: 2, low: 1 })[violation.severity?.level] ?? 0;
}

function completionMarkup(explanation, result) {
  const scorecard = explanation?.scorecard;
  const blocked = scorecard?.completionEligible === false;
  const title = blocked ? 'Выполнение заказа заблокировано' : 'Условия завершения выполнены';
  const detail = blocked
    ? 'Исправьте критичные пункты, чтобы подтвердить выполнение заказа.'
    : 'Оценка соответствует условиям брифа клиента.';
  const sourceScore = scorecard?.rawScore ?? result.score;
  const sourceStars = scorecard?.displayStars ?? result.stars;
  return `<section class="review-hero ${blocked ? 'blocked' : 'eligible'}" data-review-hero data-completion-status="${blocked ? 'blocked' : 'eligible'}">
    <div class="review-score">
      <span class="stars" aria-label="${sourceStars} из 5 звёзд">${'★'.repeat(sourceStars)}${'☆'.repeat(5 - sourceStars)}</span>
      <strong>${Math.round(sourceScore * 100)}<small>/100</small></strong>
      <span class="review-status-chip">${blocked ? 'Выполнение заблокировано' : 'Готово к сдаче'}</span>
    </div>
    <div class="review-summary">
      <span class="eyebrow">Итог проверки</span>
      <h2>${title}</h2>
      <p>${detail}</p>
      ${scoreChannels(result)}
    </div>
  </section>`;
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

function instanceActions(violation) {
  const instances = Array.isArray(violation.instances) ? violation.instances : [];
  if (instances.length === 0) return '<p class="explanation-room-scope">Нет размещённых предметов для выбора.</p>';
  return `<ul class="explanation-instance-list">${instances.map(instance => (
    `<li><button type="button" data-focus-instance="${escapeHtml(instance.instanceId)}" aria-label="Показать ${escapeHtml(instance.displayName)} в комнате">Показать: ${escapeHtml(instance.displayName)}</button></li>`
  )).join('')}</ul>`;
}

function issueFacts(violation) {
  return `<dl class="explanation-facts"><div><dt>Фактически</dt><dd>${escapeHtml(formatNumber(violation.fact?.actual))}</dd></div><div><dt>Требуется</dt><dd>${escapeHtml(formatNumber(violation.fact?.desired))}</dd></div></dl>`;
}

function issueRow(violation, selected) {
  return `<li><article class="review-issue severity-${escapeHtml(violation.severity?.level)}${selected ? ' is-selected' : ''}" data-review-issue="${escapeHtml(violation.id)}" data-violation-id="${escapeHtml(violation.id)}">
    <button type="button" class="review-issue-select" data-select-issue="${escapeHtml(violation.id)}" aria-expanded="${selected}">
      <span class="review-issue-tags"><span class="explanation-severity">${escapeHtml(severityLabel(violation.severity))}</span><span class="explanation-channel">${escapeHtml(channelLabel(violation.channel))}</span></span>
      <strong>${escapeHtml(violation.priority?.label ?? violation.rule?.description)}</strong>
      <span class="review-issue-remedy">${escapeHtml(violation.remediation)}</span>
      ${issueFacts(violation)}
    </button>
    ${instanceActions(violation)}
  </article></li>`;
}

function issueDetail(violation) {
  if (!violation) return '<aside class="review-issue-detail empty" data-review-detail><p>Для выбранного фильтра нет рекомендаций.</p></aside>';
  return `<aside class="review-issue-detail severity-${escapeHtml(violation.severity?.level)}" data-review-detail>
    <header><span class="explanation-severity">${escapeHtml(severityLabel(violation.severity))}</span><span class="explanation-channel">${escapeHtml(channelLabel(violation.channel))}</span></header>
    ${violation.priority ? `<p class="explanation-priority">Запрос клиента: ${escapeHtml(violation.priority.label)}</p>` : ''}
    <h3>${escapeHtml(violation.rule?.description)}</h3>
    ${issueFacts(violation)}
    <p class="explanation-impact">${escapeHtml(impactText(violation.impact))}</p>
    <p class="explanation-remediation">${escapeHtml(violation.remediation)}</p>
  </aside>`;
}

function channelBar(channelKey, label, value, weight) {
  if (typeof value !== 'number') return '';
  const percent = Math.round(value * 100);
  const weightTag = typeof weight === 'number' ? `<small>${Math.round(weight * 100)}%</small>` : '';
  return `<div class="review-channel" data-score-channel="${channelKey}">
    <dt>${label}${weightTag}</dt>
    <dd><span class="review-channel-track"><span class="review-channel-fill" style="width:${percent}%"></span></span><span class="review-channel-value">${percent}<small>/100</small></span></dd>
  </div>`;
}

function scoreChannels(result) {
  const hasSubScores = typeof result.styleScore === 'number' && typeof result.ergonomicsScore === 'number';
  if (!hasSubScores) return '';
  const weights = result.scoreWeights ?? {};
  const targetRows = Array.isArray(result.scoreBreakdown?.style?.targets) && result.scoreBreakdown.style.targets.length > 0
    ? `<ul class="style-target-breakdown" aria-label="Целевые стили клиента">${result.scoreBreakdown.style.targets.map(target => (
      `<li data-style-target="${escapeHtml(target.styleId)}"><span>${escapeHtml(target.label ?? target.styleId)} · ${escapeHtml(target.role)}</span><strong>${Math.round(target.score * 100)}/100</strong></li>`
    )).join('')}</ul>`
    : '';
  return `<dl class="score-channels" aria-label="Состав оценки">
    ${channelBar('style', 'Стиль', result.styleScore, weights.style)}
    ${channelBar('client-priority', 'Запросы клиента', result.clientPriorityScore, weights.clientPriorities)}
    ${channelBar('ergonomics', 'Эргономика', result.ergonomicsScore, weights.ergonomics)}
  </dl>${targetRows}`;
}

function orderedViolations(explanation) {
  if (!explanation || ![1, 2].includes(explanation.schemaVersion) || !Array.isArray(explanation.violations)) return [];
  return [...explanation.violations].sort((left, right) => {
    const severity = severityRank(right) - severityRank(left);
    if (severity !== 0) return severity;
    return (right.impact?.totalScoreDelta ?? 0) - (left.impact?.totalScoreDelta ?? 0);
  });
}

function matchesFilter(violation, filter) {
  if (filter === 'all') return true;
  if (filter === 'critical') return violation.severity?.critical === true;
  return violation.channel === filter;
}

export class EvaluationView {
  constructor(container, { onFocusInstance = null, onClose = null } = {}) {
    this.container = container;
    if (onFocusInstance !== null && typeof onFocusInstance !== 'function') throw new Error('EvaluationView onFocusInstance must be a function or null');
    if (onClose !== null && typeof onClose !== 'function') throw new Error('EvaluationView onClose must be a function or null');
    this.onFocusInstance = onFocusInstance;
    this.onClose = onClose;
    this.selectedViolationId = null;
    this.filter = 'all';
    this.result = null;
  }

  async init() {}

  render(result) {
    this.result = result;
    this.filter = 'all';
    this.selectedViolationId = null;
    this._render();
  }

  _render() {
    const result = this.result;
    const feedback = (Array.isArray(result.feedback) ? result.feedback : [result.feedback]).filter(Boolean);
    const allIssues = orderedViolations(result.explanation);
    const issues = allIssues.filter(issue => matchesFilter(issue, this.filter));
    if (!issues.some(issue => issue.id === this.selectedViolationId)) this.selectedViolationId = issues[0]?.id ?? null;
    const selected = issues.find(issue => issue.id === this.selectedViolationId) ?? null;
    const feedbackMarkup = feedback.length && allIssues.length === 0
      ? `<ul class="feedback">${feedback.map(message => `<li>${escapeHtml(message)}</li>`).join('')}</ul>`
      : '';
    const reportedIssueCount = allIssues.length || (Array.isArray(result.violations) ? result.violations.length : 0);
    const prompt = reportedIssueCount > 0 ? `${reportedIssueCount} подсказок для следующей попытки` : 'Комната собрана гармонично';
    const filters = [['all', 'Все'], ['critical', 'Критичные'], ['style', 'Стиль'], ['client-priority', 'Клиент'], ['ergonomics', 'Эргономика']];

    this.container.innerHTML = `<section class="review-workspace" data-review-workspace aria-labelledby="evaluation-title">
      <header class="review-topbar"><div><span class="eyebrow">Результат расстановки</span><h1 id="evaluation-title">Проверка комнаты</h1></div><button class="close" type="button" data-close aria-label="Вернуться к редактированию">×</button></header>
      ${completionMarkup(result.explanation, result)}
      <section class="review-repairs" aria-labelledby="review-repairs-title">
        <header class="review-repairs-header"><div><h2 id="review-repairs-title">Что исправить</h2><p class="score-label${allIssues.length ? '' : ' success-note'}">${prompt}</p></div><div class="review-filters" role="toolbar" aria-label="Фильтр рекомендаций">${filters.map(([id, label]) => `<button type="button" data-review-filter="${id}" aria-pressed="${this.filter === id}">${label}</button>`).join('')}</div></header>
        <ol class="review-issue-list" data-review-issue-list data-explanation-list>${issues.map(issue => issueRow(issue, issue.id === this.selectedViolationId)).join('')}</ol>
        ${issueDetail(selected)}
      </section>
      ${feedbackMarkup}
      <footer class="review-footer"><button type="button" class="review-continue" data-close>Вернуться к редактированию</button></footer>
    </section>`;

    this.container.querySelectorAll('[data-close]').forEach(button => { button.onclick = () => { this.hide(); this.onClose?.(); }; });
    this.container.querySelectorAll('[data-focus-instance]').forEach(button => { button.onclick = () => this.onFocusInstance?.(button.dataset.focusInstance); });
    this.container.querySelectorAll('[data-select-issue]').forEach(button => {
      button.onclick = () => { this.selectedViolationId = button.dataset.selectIssue; this._render(); };
    });
    this.container.querySelectorAll('[data-review-filter]').forEach(button => {
      button.onclick = () => { this.filter = button.dataset.reviewFilter; this._render(); };
    });
  }

  hide() {
    this.container.replaceChildren();
    this.result = null;
    this.selectedViolationId = null;
    this.filter = 'all';
  }

  destroy() { this.hide(); }
}

export default EvaluationView;
