const TYPE_ICONS = { sofa: '▰', chair: '◈', table: '▱', lighting: '✦', storage: '▤', decor: '◇', bed: '▰' };
const TYPE_COLORS = { sofa: '#6b86a6', chair: '#527c70', table: '#b98a5c', lighting: '#d8ad68', storage: '#8796a9', decor: '#b47772', bed: '#877ba6' };

export class ItemCatalogView {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
  }

  async init() {}

  render(items, selectedItemId = null) {
    this.container.innerHTML = `
      <div class="library-header">
        <div>
          <span class="eyebrow">Коллекция</span>
          <h2>Предметы</h2>
        </div>
        <span class="library-count">${items.length}</span>
      </div>
      <p class="catalog-subtitle">Выберите предмет и разместите его в комнате</p>
      <div class="catalog-grid" aria-label="Предметы для размещения"></div>
    `;
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

  destroy() { this.container.replaceChildren(); }
}
