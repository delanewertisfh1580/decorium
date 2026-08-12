const TYPE_ICONS = { sofa: '▰', chair: '◈', table: '▱', lighting: '✦', storage: '▤', decor: '◇', bed: '▰' };
const TYPE_COLORS = { sofa: '#6b86a6', chair: '#527c70', table: '#b98a5c', lighting: '#d8ad68', storage: '#8796a9', decor: '#b47772', bed: '#877ba6' };

export class ItemCatalogView {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
    this.isOpen = false;
  }

  async init() {}

  render(items, selectedItemId = null) {
    const open = this.isOpen;
    this.container.innerHTML = `
      <details class="library-spoiler" data-catalog-spoiler${open ? ' open' : ''}>
        <summary class="library-toggle" aria-label="Открыть каталог предметов">
          <span class="library-toggle-icon" aria-hidden="true">⌂</span>
          <span class="library-toggle-copy"><b>Каталог</b><small>${items.length} предметов</small></span>
          <span class="library-toggle-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="catalog-content">
          <div class="catalog-grid" aria-label="Предметы для размещения"></div>
        </div>
      </details>
    `;

    const spoiler = this.container.querySelector('[data-catalog-spoiler]');
    this.container.classList.toggle('is-open', open);
    spoiler.addEventListener('toggle', () => {
      this.isOpen = spoiler.open;
      this.container.classList.toggle('is-open', spoiler.open);
    });

    const grid = this.container.querySelector('.catalog-grid');
    for (const item of items) {
      const button = document.createElement('button');
      button.className = `item-card${item.id === selectedItemId ? ' selected' : ''}`;
      button.type = 'button';
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
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('is-open');
    const spoiler = this.container.querySelector('[data-catalog-spoiler]');
    if (spoiler) spoiler.open = false;
  }

  destroy() { this.container.replaceChildren(); }
}
