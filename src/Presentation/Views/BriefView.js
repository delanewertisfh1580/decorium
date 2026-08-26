const STYLE_LABELS = Object.freeze({
  scandinavian: 'Скандинавский',
  japandi: 'Japandi',
  eclectic: 'Эклектика'
});

const FEATURE_LABELS = Object.freeze({
  woodShare: 'Натуральное дерево',
  plasticShare: 'Пластик',
  metalShare: 'Металл',
  formSimplicity: 'Простота форм',
  saturationLevel: 'Яркость цвета',
  warmPaletteShare: 'Тёплые тона',
  roundnessShare: 'Плавные формы'
});

const AFFORDANCE_LABELS = Object.freeze({
  'coffee-surface': 'журнальный столик',
  'dining-seat': 'стул',
  'dining-surface': 'обеденный стол',
  'floor-decor': 'напольный декор',
  'light-source': 'светильник',
  'lounge-seat': 'диван или кресло',
  'media-support': 'ТВ-тумба',
  'rest-surface': 'место для отдыха',
  'storage-volume': 'система хранения',
  'view-target': 'ТВ-зона',
  'wall-decor': 'настенный декор',
  'work-seat': 'рабочий стул',
  'work-surface': 'рабочий стол'
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
  return STYLE_LABELS[target.styleId] ?? target.label ?? target.styleId;
}

function sharePercent(value) {
  return `${Math.round(value * 100)}%`;
}

/** Translates one authored style constraint into a player-readable requirement. */
function constraintLine(constraint) {
  const label = FEATURE_LABELS[constraint.feature] ?? constraint.feature;
  return constraint.operator === 'lte'
    ? `${label} — не выше ${sharePercent(constraint.threshold)}`
    : `${label} — не ниже ${sharePercent(constraint.threshold)}`;
}

function affordanceLabel(affordance) {
  return AFFORDANCE_LABELS[affordance] ?? affordance;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function scenarioItem(scenario) {
  const roles = (scenario.requiredRoles ?? [])
    .map(role => `${affordanceLabel(role.affordance)} ×${role.minCount}`)
    .join(' + ');
  const critical = scenario.critical === true
    ? '<em class="brief-critical">обязательно для сдачи</em>'
    : '';
  return `<li><strong>${scenario.label ?? 'Сценарий'}</strong><span>${capitalize(roles)}</span>${critical}</li>`;
}

function layoutRuleItem(rule) {
  const anchor = affordanceLabel(rule.anchorSelector?.affordance);
  const partner = affordanceLabel(rule.partnerSelector?.affordance);
  const min = rule.distance?.min ?? 0;
  const max = rule.distance?.max;
  if (rule.kind === 'front-adjacency') {
    const angle = rule.maxAngleDegrees != null ? `, развернуть не более чем на ${rule.maxAngleDegrees}°` : '';
    return `<li><span class="brief-relation">${capitalize(anchor)}</span> ставится фронтально к «${partner}»${max != null ? ` на расстоянии ${min}–${max} м` : ''}${angle}.</li>`;
  }
  return `<li><span class="brief-relation">${capitalize(anchor)}</span> ставится вплотную к «${partner}»${max != null ? ` (зазор ${min}–${max} м)` : ''}.</li>`;
}

function functionalSection(policy) {
  const rules = policy?.ergonomicsRules?.functionalLayoutRules ?? [];
  const scenarios = policy?.ergonomicsRules?.requiredFunctionalScenarios ?? [];
  if (rules.length === 0 && scenarios.length === 0) return '';
  const scenarioList = scenarios.map(scenarioItem).join('');
  const ruleList = rules.map(layoutRuleItem).join('');
  return `
        <section class="brief-functional" aria-labelledby="brief-functional-title">
          <h2 id="brief-functional-title">Как организовать пространство</h2>
          ${scenarioList ? `<ul class="brief-scenarios">${scenarioList}</ul>` : ''}
          ${ruleList ? `<ul class="brief-layout-rules">${ruleList}</ul>` : ''}
          <p class="brief-passage-hint">Проходы к двери и окну должны оставаться свободными — это проверяется автоматически.</p>
        </section>`;
}

/** Renders authored client context; it never calculates score or completion itself. */
export class BriefView {
  constructor(container, { onStartEditing = null, onClose = null } = {}) {
    this.container = container ?? null;
    this.onStartEditing = typeof onStartEditing === 'function' ? onStartEditing : () => {};
    this.onClose = typeof onClose === 'function' ? onClose : () => {};
  }

  render({ brief, mode, levelLabel = 'Комната', styleProfiles = [] } = {}) {
    if (!['launch', 'drawer'].includes(mode)) throw new Error('BriefView mode is not supported');
    const authoredBrief = requireBrief(brief);
    if (!this.container) return;

    const constraintsByStyleId = new Map(styleProfiles.map(profile => [profile.styleId, profile.constraints ?? []]));
    const priorityChips = authoredBrief.clientPriorities.map(priority => (
      `<li>${priority.label}</li>`
    )).join('');
    const styleTargets = authoredBrief.styleTargets.map(target => {
      const constraints = constraintsByStyleId.get(target.styleId) ?? [];
      const criteria = constraints.length > 0
        ? `<ul class="brief-style-criteria">${constraints.map(constraint => `<li>${constraintLine(constraint)}</li>`).join('')}</ul>`
        : '';
      return `<li><strong>${styleLabel(target)}</strong><span>${target.role === 'primary' ? 'Основной стиль' : 'Поддерживающий стиль'}</span>${criteria}</li>`;
    }).join('');
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
        ${functionalSection(authoredBrief.evaluationPolicy)}
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
