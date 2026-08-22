function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function itemVariantMarkup(placed, unlockedIds) {
  if (!placed?.item?.variants?.length) return '<p class="design-inspector-empty">Для этого предмета нет авторских вариантов.</p>';
  const activeVariantId = placed.configuration?.variantId ?? placed.item.baseVariantId;
  return placed.item.variants.map(variant => {
    const unlocked = unlockedIds.has(variant.unlockId);
    const active = variant.id === activeVariantId;
    return `<button class="design-option ${active ? 'is-active' : ''}" type="button" data-design-variant="${escapeHtml(variant.id)}" ${unlocked ? '' : 'disabled'} aria-pressed="${active}">
      <i class="design-swatch" style="--swatch:${escapeHtml(variant.visual.color)}"></i>
      <span>${escapeHtml(variant.label)}</span><small>${unlocked ? escapeHtml(variant.visual.materialId) : 'Откроется позже'}</small>
    </button>`;
  }).join('');
}

function surfaceMarkup(surface, currentFinishId, finishes, unlockedIds) {
  const options = finishes.filter(finish => finish.surface === surface).map(finish => {
    const unlocked = unlockedIds.has(finish.unlockId);
    const active = finish.id === currentFinishId;
    return `<button class="design-option ${active ? 'is-active' : ''}" type="button" data-design-surface="${surface}" data-design-finish="${escapeHtml(finish.id)}" ${unlocked ? '' : 'disabled'} aria-pressed="${active}">
      <i class="design-swatch" style="--swatch:${escapeHtml(finish.visual.color)}"></i>
      <span>${escapeHtml(finish.label)}</span><small>${unlocked ? 'Доступно' : 'Откроется позже'}</small>
    </button>`;
  }).join('');
  return options || '<p class="design-inspector-empty">Нет вариантов отделки.</p>';
}

export class DesignInspectorView {
  constructor(container, { onVariant = () => {}, onSurface = () => {} } = {}) {
    this.container = container;
    this.onVariant = onVariant;
    this.onSurface = onSurface;
    this._onClick = this._onClick.bind(this);
  }

  async init() {
    if (this.container) this.container.addEventListener('click', this._onClick);
  }

  render({ roomState = null, selectedItemId = null, surfaceFinishes = [], unlockedIds = [] } = {}) {
    if (!this.container) return;
    const unlocked = new Set(unlockedIds);
    const placed = selectedItemId ? roomState?.getItem(selectedItemId) : null;
    const surfaces = roomState?.surfaceConfiguration;
    this.container.innerHTML = `<details class="design-inspector-spoiler" ${placed ? 'open' : ''}>
      <summary class="design-inspector-toggle"><span class="design-inspector-icon">◇</span><span><b>Дизайн</b><small>${placed ? escapeHtml(placed.item.name) : 'Выберите предмет'}</small></span><span class="design-inspector-chevron">⌄</span></summary>
      <div class="design-inspector-content">
        <section><strong>Вариант предмета</strong><div class="design-option-grid">${itemVariantMarkup(placed, unlocked)}</div></section>
        <section><strong>Отделка комнаты</strong><span class="design-section-label">Пол</span><div class="design-option-grid">${surfaceMarkup('floor', surfaces?.floorFinishId, surfaceFinishes, unlocked)}</div><span class="design-section-label">Стены</span><div class="design-option-grid">${surfaceMarkup('wall', surfaces?.wallFinishId, surfaceFinishes, unlocked)}</div></section>
      </div>
    </details>`;
  }

  _onClick(event) {
    const variant = event.target.closest('[data-design-variant]');
    if (variant && !variant.disabled) this.onVariant(variant.dataset.designVariant);
    const finish = event.target.closest('[data-design-finish]');
    if (finish && !finish.disabled) this.onSurface(finish.dataset.designSurface, finish.dataset.designFinish);
  }

  destroy() { this.container?.removeEventListener('click', this._onClick); }
}

export default DesignInspectorView;
