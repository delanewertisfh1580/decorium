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
      <h2>Библиотека предметов</h2>
      <p class="catalog-subtitle">Выберите предмет, затем кликните по полу, чтобы переместить выбранный объект.</p>
      <div class="catalog-grid"></div>
    `;
    const grid = this.container.querySelector('.catalog-grid');
    for (const item of items) {
      const button = document.createElement('button');
      button.className = `item-card${item.id === selectedItemId ? ' selected' : ''}`;
      button.type = 'button';
      button.style.setProperty('--item-color', TYPE_COLORS[item.type] ?? '#6fa8ff');
      button.innerHTML = `
        <span class="item-icon">${TYPE_ICONS[item.type] ?? '◇'}</span>
        <span><span class="item-name">${item.name}</span><span class="item-meta">${item.dimensions.x.toFixed(1)} × ${item.dimensions.z.toFixed(1)} м</span></span>
        <span class="item-add">+</span>
      `;
      button.addEventListener('click', () => this.onSelect(item.id));
      grid.appendChild(button);
    }
  }

  destroy() { this.container.replaceChildren(); }
}
