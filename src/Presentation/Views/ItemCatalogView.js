const TYPE_ICONS = { sofa: '▰', chair: '◈', table: '▱', lighting: '✦', storage: '▤', decor: '◇', bed: '▰' };
const TYPE_COLORS = { sofa: '#6b86a6', chair: '#527c70', table: '#b98a5c', lighting: '#d8ad68', storage: '#8796a9', decor: '#b47772', bed: '#877ba6' };
const CATEGORY_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'all', label: 'Все', types: null }),
  Object.freeze({ id: 'seating', label: 'Сиденья', types: Object.freeze(['chair', 'sofa']) }),
  Object.freeze({ id: 'bedroom', label: 'Спальня', types: Object.freeze(['bed']) }),
  Object.freeze({ id: 'tables', label: 'Столы', types: Object.freeze(['table']) }),
  Object.freeze({ id: 'lighting', label: 'Свет', types: Object.freeze(['lighting']) }),
  Object.freeze({ id: 'storage', label: 'Хранение', types: Object.freeze(['storage']) }),
  Object.freeze({ id: 'decor', label: 'Декор', types: Object.freeze(['decor']) })
]);

function matchesQuery(item, query) {
  return !query || item.name.toLocaleLowerCase('ru').includes(query);
}

export class ItemCatalogView {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
    this.isOpen = false;
    this.activeCategoryId = 'all';
    this.query = '';
    this.scrollTop = 0;
    this.selectedItemId = null;
  }

  async init() {}

  render(items, selectedItemId = null) {
    this._captureContinuityState();
    this.selectedItemId = selectedItemId;
    const categories = this._availableCategories(items);
    if (!categories.some(category => category.id === this.activeCategoryId)) this.activeCategoryId = 'all';
    const open = this.isOpen;
    this.container.innerHTML = `
      <details class="library-spoiler" data-catalog-spoiler${open ? ' open' : ''}>
        <summary class="library-toggle" aria-label="Открыть каталог предметов">
          <span class="library-toggle-icon" aria-hidden="true">⌂</span>
          <span class="library-toggle-copy"><b>Каталог</b><small data-catalog-result-count></small></span>
          <span class="library-toggle-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="catalog-content">
          <div class="catalog-search-row">
            <label class="catalog-search-label" for="catalog-search">Поиск</label>
            <input id="catalog-search" class="catalog-search" type="search" autocomplete="off" placeholder="Найти предмет" data-catalog-search />
          </div>
          <div class="catalog-tabs" role="toolbar" aria-label="Категории каталога" data-catalog-tabs></div>
          <div class="catalog-grid" aria-label="Предметы для размещения" data-catalog-grid></div>
          <p class="catalog-empty-state" data-catalog-empty-state hidden></p>
        </div>
      </details>
    `;

    const spoiler = this.container.querySelector('[data-catalog-spoiler]');
    const search = this.container.querySelector('[data-catalog-search]');
    search.value = this.query;
    this.container.classList.toggle('is-open', open);
    spoiler.addEventListener('toggle', () => {
      this.isOpen = spoiler.open;
      this.container.classList.toggle('is-open', spoiler.open);
    });
    search.addEventListener('input', event => {
      this.query = event.currentTarget.value.toLocaleLowerCase('ru').trim();
      this.scrollTop = 0;
      this._renderItems(items);
    });

    const tabs = this.container.querySelector('[data-catalog-tabs]');
    for (const category of categories) {
      const tab = document.createElement('button');
      tab.className = `catalog-tab${category.id === this.activeCategoryId ? ' is-active' : ''}`;
      tab.type = 'button';
      tab.dataset.catalogCategory = category.id;
      tab.setAttribute('aria-pressed', String(category.id === this.activeCategoryId));
      tab.textContent = category.label;
      tab.addEventListener('click', () => {
        if (this.activeCategoryId === category.id) return;
        this.activeCategoryId = category.id;
        this.scrollTop = 0;
        this._renderTabs(categories);
        this._renderItems(items);
      });
      tabs.appendChild(tab);
    }

    this._renderItems(items);
    this.container.querySelector('[data-catalog-grid]').scrollTop = this.scrollTop;
  }

  _captureContinuityState() {
    const spoiler = this.container.querySelector('[data-catalog-spoiler]');
    const grid = this.container.querySelector('[data-catalog-grid]');
    if (spoiler) this.isOpen = spoiler.open;
    if (grid) this.scrollTop = grid.scrollTop;
  }

  _availableCategories(items) {
    return CATEGORY_DEFINITIONS.filter(category => category.types === null || items.some(item => category.types.includes(item.type)));
  }

  _renderTabs(categories) {
    for (const tab of this.container.querySelectorAll('[data-catalog-category]')) {
      const isActive = tab.dataset.catalogCategory === this.activeCategoryId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
    }
    // Category availability can only change on a controller re-render, where render() rebuilds tabs.
    void categories;
  }

  _filteredItems(items) {
    const category = CATEGORY_DEFINITIONS.find(value => value.id === this.activeCategoryId) ?? CATEGORY_DEFINITIONS[0];
    return items.filter(item => (category.types === null || category.types.includes(item.type)) && matchesQuery(item, this.query));
  }

  _renderItems(items) {
    const grid = this.container.querySelector('[data-catalog-grid]');
    const resultCount = this.container.querySelector('[data-catalog-result-count]');
    const emptyState = this.container.querySelector('[data-catalog-empty-state]');
    const filteredItems = this._filteredItems(items);
    grid.replaceChildren();
    resultCount.textContent = `${filteredItems.length} из ${items.length} предметов`;
    emptyState.hidden = filteredItems.length > 0;
    emptyState.textContent = filteredItems.length === 0 ? 'Ничего не найдено. Измените запрос или выберите другую категорию.' : '';

    for (const item of filteredItems) {
      const button = document.createElement('button');
      button.className = `item-card${item.id === this.selectedItemId ? ' selected' : ''}`;
      button.type = 'button';
      button.dataset.catalogItemId = item.id;
      button.setAttribute('aria-label', `Добавить ${item.name}`);
      button.style.setProperty('--item-color', TYPE_COLORS[item.type] ?? '#6fa8ff');
      button.innerHTML = `
        <span class="item-icon" aria-hidden="true">${TYPE_ICONS[item.type] ?? '◇'}</span>
        <span class="item-copy"><span class="item-name">${item.name}</span><span class="item-meta">${item.dimensions.x.toFixed(1)} × ${item.dimensions.z.toFixed(1)} м</span></span>
        <span class="item-add" aria-hidden="true">+</span>
      `;
      button.addEventListener('click', () => this.onSelect(item.id));
      grid.appendChild(button);
    }
    grid.scrollTop = this.scrollTop;
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('is-open');
    const spoiler = this.container.querySelector('[data-catalog-spoiler]');
    if (spoiler) spoiler.open = true;
  }

  close() {
    this._captureContinuityState();
    this.isOpen = false;
    this.container.classList.remove('is-open');
    const spoiler = this.container.querySelector('[data-catalog-spoiler]');
    if (spoiler) spoiler.open = false;
  }

  destroy() { this.container.replaceChildren(); }
}
