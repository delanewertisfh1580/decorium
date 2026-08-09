/**
 * View для каталога предметов.
 * Отображает доступные предметы для размещения.
 * 
 * @implements {import('./IView.js').IView}
 */
export class ItemCatalogView {
    /**
     * @param {HTMLElement} container 
     * @param {Function} onSelectCallback 
     */
    constructor(container, onSelectCallback) {
        this._container = container;
        this._onSelect = onSelectCallback;
        this._items = [];
    }

    async init() {
        this._container.innerHTML = '<h3>Каталог предметов</h3><div id="catalog-items"></div>';
    }

    /**
     * @param {import('../ViewModels/ItemViewModel.js').ItemViewModel[]} items 
     */
    render(items) {
        this._items = items;
        const catalogDiv = this._container.querySelector('#catalog-items');
        if (!catalogDiv) return;

        catalogDiv.innerHTML = '';
        
        // Группируем по типам
        const byType = {};
        items.forEach(item => {
            if (!byType[item.typeId]) byType[item.typeId] = [];
            byType[item.typeId].push(item);
        });

        Object.entries(byType).forEach(([typeId, typeItems]) => {
            const section = document.createElement('div');
            section.className = 'catalog-section';
            section.innerHTML = `<h4>Тип ${typeId}</h4>`;
            
            const grid = document.createElement('div');
            grid.className = 'catalog-grid';
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
            grid.style.gap = '10px';

            typeItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';
                card.style.border = item.isSelected ? '2px solid #FFC107' : '1px solid #ccc';
                card.style.padding = '5px';
                card.style.cursor = 'pointer';
                card.style.textAlign = 'center';
                card.innerHTML = `
                    <div style="width:60px;height:60px;background:#${item.styleId === 'modern' ? '4CAF50' : '2196F3'};margin:0 auto;"></div>
                    <div style="font-size:12px;">${item.name}</div>
                    <div style="font-size:10px;color:#666;">$${item.price}</div>
                `;
                
                card.onclick = () => this._onSelect(item.id);
                grid.appendChild(card);
            });

            section.appendChild(grid);
            catalogDiv.appendChild(section);
        });
    }

    destroy() {
        this._container.innerHTML = '';
    }

    /**
     * Выделяет предмет в каталоге
     * @param {string} itemId 
     */
    selectItem(itemId) {
        const cards = this._container.querySelectorAll('.item-card');
        cards.forEach((card, index) => {
            const item = this._items[index];
            if (item && item.id === itemId) {
                card.style.border = '2px solid #FFC107';
            } else if (item) {
                card.style.border = '1px solid #ccc';
            }
        });
    }
}
