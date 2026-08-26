const MATERIAL_LABELS = Object.freeze({
  'oak-light': 'светлый дуб',
  walnut: 'тёмный орех',
  textile: 'текстиль',
  velvet: 'бархат',
  linen: 'лён',
  ceramic: 'керамика',
  terracotta: 'терракота',
  brass: 'латунь',
  'black-metal': 'чёрный металл',
  graphite: 'графит',
  'midnight-metal': 'полированный металл'
});

const COLOR_LABELS = Object.freeze({
  '#a97956': 'медовый дуб',
  '#9c7251': 'натуральное дерево',
  '#8b654b': 'ореховый дуб',
  '#8d725f': 'тёплый тауп',
  '#604430': 'тёмный орех',
  '#594035': 'шоколадный орех',
  '#405d59': 'глубокий шалфей',
  '#647b92': 'стальной синий',
  '#9a745e': 'песочный лён',
  '#78939b': 'дымчато-синий',
  '#b36e50': 'жжёная терракота',
  '#c79b55': 'тёплая латунь',
  '#2d3440': 'графитовый металл',
  '#273347': 'графит',
  '#172131': 'полночный металл'
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function formatDimension(dimensions) {
  if (!dimensions || typeof dimensions.x !== 'number' || typeof dimensions.z !== 'number') return 'размер по умолчанию';
  return `${dimensions.x.toFixed(2)} × ${dimensions.z.toFixed(2)} м`;
}

function materialLabel(materialId) {
  return MATERIAL_LABELS[materialId] ?? materialId ?? 'материал не указан';
}

function colorLabel(color) {
  const normalized = String(color ?? '').toLowerCase();
  return COLOR_LABELS[normalized] ?? `цвет ${normalized || 'не указан'}`;
}

function variantMeta(variant, placed) {
  const dimensions = variant.dimensions ?? placed.item.dimensions;
  return `${escapeHtml(materialLabel(variant.visual.materialId))} · ${escapeHtml(colorLabel(variant.visual.color))} · ${escapeHtml(formatDimension(dimensions))}`;
}

function itemVariantMarkup(placed, unlockedIds) {
  if (!placed?.item?.variants?.length) return '<p class="design-inspector-empty">Для этого предмета нет авторских вариантов.</p>';
  const activeVariantId = placed.configuration?.variantId ?? placed.item.baseVariantId;
  return placed.item.variants.map(variant => {
    const unlocked = unlockedIds.has(variant.unlockId);
    const active = variant.id === activeVariantId;
    return `<button class="design-option ${active ? 'is-active' : ''}" type="button" data-design-variant="${escapeHtml(variant.id)}" ${unlocked ? '' : 'disabled'} aria-pressed="${active}" aria-label="${escapeHtml(variant.label)}: ${variantMeta(variant, placed)}">
      <i class="design-swatch" style="--swatch:${escapeHtml(variant.visual.color)}"></i>
      <span class="design-option-copy"><span>${escapeHtml(variant.label)}</span><small>${variantMeta(variant, placed)}</small></span>
    </button>`;
  }).join('');
}

function currentConfigurationMarkup(placed) {
  const variantId = placed?.configuration?.variantId ?? placed?.item?.baseVariantId;
  const variant = placed?.item?.getVariant?.(variantId) ?? placed?.item?.variants?.find(value => value.id === variantId);
  if (!variant) return '';
  return `<p class="design-current-configuration" data-current-configuration>Сейчас: <strong>${escapeHtml(variant.label)}</strong> · ${variantMeta(variant, placed)}</p>`;
}

function itemActionsMarkup(placed) {
  if (!placed) return '';
  return `<section class="contextual-inspector-actions" aria-label="Действия с выбранным предметом">
    <button type="button" data-inspector-action="raise">Поднять</button>
    <button type="button" data-inspector-action="lower">Опустить</button>
    <button type="button" data-inspector-action="rotate">Повернуть</button>
    <button type="button" data-inspector-action="delete" class="danger">Удалить</button>
  </section>`;
}

function surfaceMarkup(surface, currentFinishId, finishes, unlockedIds) {
  const options = finishes.filter(finish => finish.surface === surface).map(finish => {
    const unlocked = unlockedIds.has(finish.unlockId);
    const active = finish.id === currentFinishId;
    return `<button class="design-option ${active ? 'is-active' : ''}" type="button" data-design-surface="${escapeHtml(surface)}" data-design-finish="${escapeHtml(finish.id)}" ${unlocked ? '' : 'disabled'} aria-pressed="${active}" aria-label="${escapeHtml(finish.label)}">
      <i class="design-swatch" style="--swatch:${escapeHtml(finish.visual.color)}"></i>
      <span class="design-option-copy"><span>${escapeHtml(finish.label)}</span><small>${unlocked ? 'Доступно' : 'Откроется позже'}</small></span>
    </button>`;
  }).join('');
  return options || '<p class="design-inspector-empty">Нет вариантов отделки.</p>';
}

export class DesignInspectorView {
  constructor(container, {
    onVariant = () => {},
    onSurface = () => {},
    onRaise = () => {},
    onLower = () => {},
    onRotate = () => {},
    onDelete = () => {},
    onClose = () => {}
  } = {}) {
    this.container = container;
    this.onVariant = onVariant;
    this.onSurface = onSurface;
    this.onRaise = onRaise;
    this.onLower = onLower;
    this.onRotate = onRotate;
    this.onDelete = onDelete;
    this.onClose = onClose;
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
    const itemContext = Boolean(placed);
    const content = itemContext
      ? `<section class="design-inspector-section" data-inspector-section="item">
          <strong>Внешний вид и размер</strong>
          ${currentConfigurationMarkup(placed)}
          <div class="design-option-grid" role="listbox" aria-label="Варианты выбранного предмета">${itemVariantMarkup(placed, unlocked)}</div>
        </section>`
      : `<section class="design-inspector-section" data-inspector-section="room">
          <strong>Отделка комнаты</strong>
          <span class="design-section-label">Пол</span>
          <div class="design-option-grid" role="listbox" aria-label="Отделка пола">${surfaceMarkup('floor', surfaces?.floorFinishId, surfaceFinishes, unlocked)}</div>
          <span class="design-section-label">Стены</span>
          <div class="design-option-grid" role="listbox" aria-label="Отделка стен">${surfaceMarkup('wall', surfaces?.wallFinishId, surfaceFinishes, unlocked)}</div>
        </section>`;

    this.container.innerHTML = `<section class="contextual-inspector" data-contextual-inspector data-inspector-context="${itemContext ? 'item' : 'room'}" aria-label="${itemContext ? 'Настройка выбранного предмета' : 'Настройка комнаты'}">
      <header class="contextual-inspector-header">
        <div><span class="design-section-label">${itemContext ? 'Выбранный предмет' : 'Комната'}</span><h2>${itemContext ? escapeHtml(placed.item.name) : 'Настройка комнаты'}</h2></div>
        <button type="button" class="contextual-inspector-close" data-inspector-action="close" aria-label="Закрыть настройку">×</button>
      </header>
      ${itemActionsMarkup(placed)}
      <div class="contextual-inspector-content">${content}</div>
    </section>`;
  }

  _onClick(event) {
    const action = event.target.closest('[data-inspector-action]')?.dataset.inspectorAction;
    if (action === 'raise') this.onRaise();
    if (action === 'lower') this.onLower();
    if (action === 'rotate') this.onRotate();
    if (action === 'delete') this.onDelete();
    if (action === 'close') this.onClose();
    const variant = event.target.closest('[data-design-variant]');
    if (variant && !variant.disabled) this.onVariant(variant.dataset.designVariant);
    const finish = event.target.closest('[data-design-finish]');
    if (finish && !finish.disabled) this.onSurface(finish.dataset.designSurface, finish.dataset.designFinish);
  }

  destroy() { this.container?.removeEventListener('click', this._onClick); }
}

export default DesignInspectorView;
